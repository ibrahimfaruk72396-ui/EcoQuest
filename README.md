# 🌍 EcoQuest: Blockchain-Based Sustainability Challenges

EcoQuest is a decentralized application built on the Stacks blockchain that promotes sustainable behaviors through gamified challenges. Users join challenges like recycling, composting, or using sustainable transport, verify their actions via QR codes, and earn QUEST tokens redeemable for eco-friendly rewards. The system leverages 8 Clarity smart contracts for transparency, security, and immutability.

## ✨ Features

- **Challenge Participation**: Join time-bound sustainability challenges (e.g., "Recycle 10 items this week").
- **Token Rewards**: Earn QUEST tokens for completing verified challenges.
- **Immutable Records**: All actions and completions are logged on the blockchain.
- **User Profiles**: Track challenge completions and sustainability scores.
- **Reward Marketplace**: Redeem tokens for eco-friendly products or discounts.
- **Community Governance**: Vote on new challenges or reward structures.
- **Fraud Prevention**: Ensures unique QR code scans and valid challenge submissions.
- **Leaderboard**: Ranks users based on challenge completions and impact.

## 🛠 How It Works

### For Users
1. **Register**: Create a profile via the `UserRegistry` contract.
2. **Join Challenges**: Enroll in challenges (e.g., recycling, reducing energy) via the `Challenge部分

System: ChallengeManager` contract.
3. **Complete Actions**: Perform sustainable actions and scan QR codes to verify.
4. **Verify Actions**: Submit QR code data to the `ActionVerification` contract for validation.
5. **Earn Tokens**: Receive QUEST tokens via the `TokenManager` contract upon challenge completion.
6. **Redeem Rewards**: Use tokens in the `RewardMarketplace` contract for eco-friendly rewards.
7. **Track Progress**: View your sustainability score and rank on the leaderboard via the `Leaderboard` contract.

### For Partners
- **Challenge Sponsors**: Organizations propose and fund challenges via the `ChallengeManager` contract.
- **QR Code Issuers**: Partners issue unique QR codes via the `QRCodeManager` contract.
- **Reward Providers**: Businesses offer eco-friendly products or discounts in the marketplace.

### For Community
- **Governance**: Propose and vote on new challenges or rules using the `Governance` contract.

