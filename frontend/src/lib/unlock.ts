import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = 11155111;

// Unlock Protocol Sepolia Factory (v12+)
// This is the official Unlock Inc. factory on Sepolia testnet
const UNLOCK_FACTORY_ADDRESS = '0x36b34e10295cCE69B652eEB5a8046041074515Da';

export interface DeployLockConfig {
  name: string;
  keyPrice: string;
  expirationDuration: number;
  maxNumberOfKeys: number;
}

export async function deployLock(config: DeployLockConfig): Promise<{ lockAddress: string }> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.');
  }

  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();

  // Ensure we're on Sepolia
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Unlock Factory ABI - createLock function (UnlockV14)
  // signature: createLock(uint256 _expirationDuration, address _tokenAddress, uint256 _keyPrice, uint256 _maxNumberOfKeys, string _lockName, bytes12)
  const UNLOCK_FACTORY_ABI = [
    'function createLock(uint256 _expirationDuration, address _tokenAddress, uint256 _keyPrice, uint256 _maxNumberOfKeys, string _lockName, bytes12) returns (address)',
    'event NewLock(address indexed newLockAddress, address indexed owner)',
  ];

  const unlockFactory = new ethers.Contract(UNLOCK_FACTORY_ADDRESS, UNLOCK_FACTORY_ABI, signer);

  // address(0) = ETH (no token gating)
  const tokenAddress = ethers.constants.AddressZero;

  // Convert key price from ETH string to wei
  const keyPriceWei = ethers.utils.parseEther(config.keyPrice);

  const tx = await unlockFactory.createLock(
    config.expirationDuration,
    tokenAddress,
    keyPriceWei,
    config.maxNumberOfKeys,
    config.name,
    '0x000000000000000000000000', // bytes12 zero
    {
      gasLimit: 3000000,
    }
  );

  const receipt = await tx.wait();

  // Extract lock address from NewLock event
  const lockCreatedEvent = receipt.events?.find(
    (e: any) => e.event === 'NewLock'
  );

  if (lockCreatedEvent?.args?.newLockAddress) {
    return { lockAddress: lockCreatedEvent.args.newLockAddress };
  }

  // Fallback: parse from logs (NewLock topic)
  const NEW_LOCK_TOPIC = ethers.utils.id('NewLock(address,address)');
  for (const log of receipt.logs) {
    if (log.topics[0] === NEW_LOCK_TOPIC) {
      const lockAddress = ethers.utils.getAddress('0x' + log.topics[1].slice(26));
      return { lockAddress };
    }
  }

  throw new Error('Could not extract lock address from transaction receipt');
}

export function openUnlockCheckout(lockAddress: string, serviceTitle: string) {
  const redirectUrl = `${window.location.origin}/dashboard/customer`;
  const config = {
    locks: {
      [lockAddress]: {
        name: serviceTitle,
        network: SEPOLIA_CHAIN_ID,
      },
    },
    network: SEPOLIA_CHAIN_ID,
    pessimistic: false,
    redirect: redirectUrl,
  };
  const configJSON = encodeURIComponent(JSON.stringify(config));
  const url = `https://app.unlock-protocol.com/checkout?paywallConfig=${configJSON}`;
  window.open(url, '_blank');
}

export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  return `https://sepolia.etherscan.io/${type}/${address}`;
}
