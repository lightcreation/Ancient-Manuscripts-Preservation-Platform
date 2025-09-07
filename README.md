# 📜 Ancient Manuscripts Preservation Platform

Welcome to a revolutionary blockchain platform for digitizing and preserving ancient manuscripts! This project addresses the real-world problem of deteriorating physical artifacts, limited access for researchers, and unclear ownership in cultural heritage. By leveraging the Stacks blockchain and Clarity smart contracts, we create NFTs for verifiable ownership while ensuring open access for educational and research purposes through controlled digital rights management.

## ✨ Features

📸 Digitize manuscripts with secure hashing and metadata storage  
🖼️ Mint NFTs for ownership of digital representations  
🔍 Grant timed or permission-based access for researchers  
📚 Maintain a public registry for discovery and verification  
🔒 Prevent unauthorized alterations or duplications  
🤝 Enable collaborative annotations without compromising originals  
💰 Support crowdfunding for preservation efforts  
📈 Track provenance and usage history immutably  

## 🛠 How It Works

**For Museums and Owners**  
- Upload a high-resolution scan or digital version of the manuscript.  
- Generate a unique hash (e.g., SHA-256) of the digital file.  
- Use the ManuscriptRegistry contract to register the manuscript with metadata (title, origin, age, description).  
- Mint an NFT via the NFTMinter contract to claim ownership.  
- Set access policies using the AccessControl contract to allow researchers temporary views or downloads.  

**For Researchers**  
- Search the public registry with the DiscoveryEngine contract to find manuscripts.  
- Request access through the PermissionManager contract, providing credentials or reasons.  
- Once approved, use the ViewerPortal contract to access digitized content without owning the NFT.  
- Add annotations via the AnnotationLayer contract, which stores notes immutably but separately from the core manuscript data.  

**For Funders and Collaborators**  
- Contribute to preservation campaigns using the CrowdfundPreservation contract.  
- Track funds and outcomes transparently with the ProvenanceTracker contract.  

The platform ensures manuscripts are preserved digitally, ownership is tokenized for transfer or sale, and research access is democratized without risking physical damage or IP theft.

## 🔗 Smart Contracts Overview

This project involves 8 Clarity smart contracts to handle various aspects securely and efficiently:  

1. **ManuscriptRegistry.clar**: Handles registration of digitized manuscripts, storing hashes, metadata, and initial ownership. Prevents duplicates by checking existing hashes.  
2. **NFTMinter.clar**: Mints SIP-009 compliant NFTs representing ownership of the digital manuscript. Integrates with royalty splits for creators or institutions.  
3. **AccessControl.clar**: Manages access permissions, allowing owners to grant read-only, time-limited, or credential-based access to non-owners.  
4. **PermissionManager.clar**: Processes access requests from researchers, verifies credentials, and issues temporary tokens for viewing.  
5. **ViewerPortal.clar**: Serves as the gateway for authorized users to view or download digitized content, enforcing access rules.  
6. **AnnotationLayer.clar**: Allows collaborative annotations on manuscripts, storing them in a separate layer to maintain the integrity of the original.  
7. **CrowdfundPreservation.clar**: Facilitates crowdfunding campaigns for digitization efforts, with automated fund release based on milestones.  
8. **ProvenanceTracker.clar**: Logs all transfers, access events, and modifications in an immutable chain for full auditability.  

These contracts interact seamlessly: for example, minting an NFT requires a registered manuscript, and access requests reference the ProvenanceTracker for verification.

## 🚀 Getting Started

1. Set up your Stacks development environment with Clarity.  
2. Deploy the contracts in sequence (start with ManuscriptRegistry).  
3. Integrate a front-end (e.g., React with Hiro Wallet) for user interactions.  
4. Test on the Stacks testnet before mainnet deployment.  

Protect cultural heritage today—digitize, own, and share responsibly!