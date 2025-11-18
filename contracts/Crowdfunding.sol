// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Campaign {
        address payable creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 amountRaised;
        bool completed;
        uint256 contributorsCount;
        mapping(address => uint256) contributions;
    }
    
    Campaign[] public campaigns;
    
    event CampaignCreated(uint256 campaignId, address creator, string title, uint256 goal);
    event ContributionMade(uint256 campaignId, address contributor, uint256 amount);
    event FundsWithdrawn(uint256 campaignId, uint256 amount);
    event RefundIssued(uint256 campaignId, address contributor, uint256 amount);
    
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) public {
        Campaign storage newCampaign = campaigns.push();
        newCampaign.creator = payable(msg.sender);
        newCampaign.title = _title;
        newCampaign.description = _description;
        newCampaign.goal = _goal;
        newCampaign.deadline = block.timestamp + _duration;
        newCampaign.amountRaised = 0;
        newCampaign.completed = false;
        newCampaign.contributorsCount = 0;
        
        emit CampaignCreated(campaigns.length - 1, msg.sender, _title, _goal);
    }
    
    function contribute(uint256 _campaignId) public payable {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.completed, "Campaign already completed");
        require(msg.value > 0, "Contribution must be greater than 0");
        
        if (campaign.contributions[msg.sender] == 0) {
            campaign.contributorsCount++;
        }
        
        campaign.contributions[msg.sender] += msg.value;
        campaign.amountRaised += msg.value;
        
        emit ContributionMade(_campaignId, msg.sender, msg.value);
    }
    
    function withdrawFunds(uint256 _campaignId) public {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.amountRaised >= campaign.goal, "Goal not reached");
        require(!campaign.completed, "Funds already withdrawn");
        
        campaign.completed = true;
        uint256 amount = campaign.amountRaised;
        campaign.creator.transfer(amount);
        
        emit FundsWithdrawn(_campaignId, amount);
    }
    
    function refund(uint256 _campaignId) public {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign still active");
        require(campaign.amountRaised < campaign.goal, "Goal was reached");
        require(!campaign.completed, "Campaign already completed");
        
        uint256 contributedAmount = campaign.contributions[msg.sender];
        require(contributedAmount > 0, "No contribution found");
        
        campaign.contributions[msg.sender] = 0;
        payable(msg.sender).transfer(contributedAmount);
        
        emit RefundIssued(_campaignId, msg.sender, contributedAmount);
    }
    
    function getCampaignCount() public view returns (uint256) {
        return campaigns.length;
    }
    
    function getCampaign(uint256 _campaignId) public view returns (
        address,
        string memory,
        string memory,
        uint256,
        uint256,
        uint256,
        bool,
        uint256
    ) {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        
        return (
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.goal,
            campaign.deadline,
            campaign.amountRaised,
            campaign.completed,
            campaign.contributorsCount
        );
    }
    
    function getContribution(uint256 _campaignId, address _contributor) public view returns (uint256) {
        require(_campaignId < campaigns.length, "Campaign does not exist");
        return campaigns[_campaignId].contributions[_contributor];
    }
}