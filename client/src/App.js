import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { AlertCircle, TrendingUp, Users, DollarSign, CheckCircle, RefreshCw } from 'lucide-react';

const CrowdfundingApp = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [gasPrice, setGasPrice] = useState(0);
  const [networkStats, setNetworkStats] = useState({ blockNumber: 0, networkId: 0 });

  const CONTRACT_ADDRESS = "0x9e6A95b7421e1e68DEDBb5D2e9FCfA715b2AA2aa"; // REPLACE WITH ACTUAL DEPLOYED ADDRESS

  const contractABI = [
    {"inputs":[{"internalType":"string","name":"_title","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"uint256","name":"_goal","type":"uint256"},{"internalType":"uint256","name":"_duration","type":"uint256"}],"name":"createCampaign","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"contribute","outputs":[],"stateMutability":"payable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"withdrawFunds","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_campaignId","type":"uint256"}],"name":"refund","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"getCampaignCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getCampaign","outputs":[{"internalType":"address","name":"creator","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountRaised","type":"uint256"},{"internalType":"bool","name":"completed","type":"bool"},{"internalType":"uint256","name":"contributorsCount","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"address","name":"_addr","type":"address"}],"name":"getContribution","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
  ];

  const [formData, setFormData] = useState({
    title: '', description: '', goal: '', duration: ''
  });

  useEffect(() => {
    initWeb3();
  }, []);

  const initWeb3 = async () => {
    try {
      setLoading(true);
      let web3Instance;

      if (window.ethereum) {
        web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else {
        web3Instance = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
      }

      const accounts = await web3Instance.eth.getAccounts();
      const blockNumber = await web3Instance.eth.getBlockNumber();
      const networkId = await web3Instance.eth.net.getId();
      const gasPriceWei = await web3Instance.eth.getGasPrice();
      const gasPriceGwei = web3Instance.utils.fromWei(gasPriceWei, 'gwei');

      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setNetworkStats({ blockNumber, networkId });
      setGasPrice(parseFloat(gasPriceGwei).toFixed(2));

      const contractInstance = new web3Instance.eth.Contract(contractABI, CONTRACT_ADDRESS);
      setContract(contractInstance);

      await loadCampaigns(contractInstance, web3Instance);
      setSuccess('Connected Successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError('Failed to connect. Is Ganache running on port 8545?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async (contractInstance = contract, web3Instance = web3) => {
    if (!contractInstance || !web3Instance) return;
    try {
      const count = await contractInstance.methods.getCampaignCount().call();
      const campaignsData = [];

      for (let i = 0; i < count; i++) {
        const campaign = await contractInstance.methods.getCampaign(i).call();
        let userContribution = '0';
        try {
          if (account) {
            const contrib = await contractInstance.methods.getContribution(i, account).call();
            userContribution = web3Instance.utils.fromWei(contrib, 'ether');
          }
        } catch (e) {}

        campaignsData.push({
          id: i,
          creator: campaign.creator,
          title: campaign.title,
          description: campaign.description,
          goal: campaign.goal,
          deadline: campaign.deadline,
          amountRaised: campaign.amountRaised,
          completed: campaign.completed,
          contributorsCount: parseInt(campaign.contributorsCount),
          userContribution
        });
      }
      setCampaigns(campaignsData);
    } catch (err) {
      console.error("Load campaigns error:", err);
    }
  };

  const createCampaign = async () => {
    if (!formData.title || !formData.description || !formData.goal || !formData.duration) {
      setError('Please fill all fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const goalInWei = web3.utils.toWei(formData.goal.toString(), 'ether');
      const durationInSeconds = parseInt(formData.duration) * 24 * 60 * 60;

      await contract.methods.createCampaign(
        formData.title,
        formData.description,
        goalInWei,
        durationInSeconds
      ).send({ 
        from: account,
        gas: 500000
      });

      setSuccess('Campaign Created Successfully!');
      setFormData({ title: '', description: '', goal: '', duration: '' });
      setShowCreateForm(false);
      setTimeout(() => setSuccess(''), 3000);

      await loadCampaigns(); // THIS REFRESHES THE LIST

    } catch (err) {
      setError('Transaction failed: ' + (err.message || 'Rejected'));
    } finally {
      setLoading(false);
    }
  };

  const contribute = async (campaignId) => {
    const amount = prompt("Enter amount in ETH:");
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const amountInWei = web3.utils.toWei(amount, 'ether');
      await contract.methods.contribute(campaignId).send({
        from: account,
        value: amountInWei,
        gas: 300000
      });

      setSuccess('Contribution Successful!');
      setTimeout(() => setSuccess(''), 3000);
      await loadCampaigns();

    } catch (err) {
      setError('Contribution failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async (campaignId) => {
    setLoading(true);
    try {
      await contract.methods.withdrawFunds(campaignId).send({ from: account, gas: 300000 });
      setSuccess('Funds Withdrawn!');
      await loadCampaigns();
    } catch (err) {
      setError('Withdraw failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (campaignId) => {
    setLoading(true);
    try {
      await contract.methods.refund(campaignId).send({ from: account, gas: 300000 });
      setSuccess('Refund Processed!');
      await loadCampaigns();
    } catch (err) {
      setError('Refund failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  const isDeadlinePassed = (deadline) => Date.now() / 1000 > deadline;

  const totalRaised = campaigns.reduce((sum, c) => 
    sum + parseFloat(web3?.utils.fromWei(c.amountRaised || '0', 'ether') || 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">BlockFund</h1>
          <p className="text-xl text-purple-300">Decentralized Crowdfunding on Ethereum</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <p>Connected: {formatAddress(account)}</p>
              <p className="text-sm text-green-400">Gas: {gasPrice} Gwei | Block: #{networkStats.blockNumber}</p>
            </div>
            <button onClick={initWeb3} className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700">
              <RefreshCw size={20} className="inline mr-2" /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="bg-red-600/80 p-4 rounded-lg mb-4 flex items-center gap-3">
          <AlertCircle /> <span>{error}</span>
        </div>}

        {success && <div className="bg-green-600/80 p-4 rounded-lg mb-4 flex items-center gap-3">
          <CheckCircle /> <span>{success}</span>
        </div>}

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-xl text-center">
            <TrendingUp size={40} className="mx-auto mb-2" />
            <p className="text-3xl font-bold">{campaigns.length}</p>
            <p>Total Campaigns</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl text-center">
            <DollarSign size={40} className="mx-auto mb-2" />
            <p className="text-3xl font-bold">{totalRaised.toFixed(4)} ETH</p>
            <p>Total Raised</p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-xl text-center">
            <Users size={40} className="mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {campaigns.reduce((s, c) => s + c.contributorsCount, 0)}
            </p>
            <p>Contributors</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full text-xl font-bold hover:scale-105 transition mb-8"
        >
          {showCreateForm ? 'Cancel' : '+ Create New Campaign'}
        </button>

        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-10 border border-white/30">
            <h2 className="text-3xl font-bold mb-6">Create Campaign</h2>
            <input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 mb-4 rounded-lg bg-white/10 border border-white/30" />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 mb-4 rounded-lg bg-white/10 border border-white/30 h-32" />
            <input type="number" placeholder="Goal (ETH)" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="w-full p-4 mb-4 rounded-lg bg-white/10 border border-white/30" />
            <input type="number" placeholder="Duration (days)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-4 mb-6 rounded-lg bg-white/10 border border-white/30" />
            <button onClick={createCampaign} disabled={loading} className="w-full bg-green-600 py-4 rounded-lg text-xl font-bold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-2xl text-purple-300">
              No campaigns yet. Be the first to create one!
            </div>
          ) : (
            campaigns.map(c => {
              const raised = parseFloat(web3?.utils.fromWei(c.amountRaised, 'ether') || 0);
              const goal = parseFloat(web3?.utils.fromWei(c.goal, 'ether') || 0);
              const progress = (raised / goal) * 100;
              const expired = isDeadlinePassed(c.deadline);
              const success = raised >= goal;

              return (
                <div key={c.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:scale-105 transition">
                  <h3 className="text-2xl font-bold mb-2">{c.title}</h3>
                  <p className="text-purple-300 text-sm mb-4">by {formatAddress(c.creator)}</p>
                  <p className="mb-6 text-gray-300">{c.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{raised.toFixed(4)} ETH</span>
                      <span>{goal} ETH goal</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div className={`h-4 rounded-full ${success ? 'bg-green-500' : 'bg-purple-600'}`} style={{width: `${Math.min(progress, 100)}%`}}></div>
                    </div>
                    <p className="text-right text-sm mt-1">{progress.toFixed(1)}%</p>
                  </div>

                  {!c.completed && !expired && (
                    <button onClick={() => contribute(c.id)} className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700">
                      Contribute
                    </button>
                  )}

                  {c.creator.toLowerCase() === account.toLowerCase() && success && !c.completed && (
                    <button onClick={() => withdraw(c.id)} className="w-full bg-green-600 py-3 rounded-lg font-bold hover:bg-green-700 mt-3">
                      Withdraw Funds
                    </button>
                  )}

                  {!c.completed && expired && !success && parseFloat(c.userContribution) > 0 && (
                    <button onClick={() => requestRefund(c.id)} className="w-full bg-red-600 py-3 rounded-lg font-bold hover:bg-red-700 mt-3">
                      Request Refund
                    </button>
                  )}

                  {c.completed && <div className="text-center text-green-400 font-bold mt-4">Completed</div>}
                  {expired && !success && !c.completed && <div className="text-center text-red-400 font-bold mt-4">Failed</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CrowdfundingApp;