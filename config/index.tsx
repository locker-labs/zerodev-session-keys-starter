import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';

// Get projectId from <https://cloud.reown.com>
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) throw new Error('Project ID is not defined');

const metadata = {
  name: 'ZeroDev Session Keys Starter',
  description: 'NextJS, Reown Appkit, and ZeroDev Session Keys',
  url: '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create wagmiConfig
const chains = [arbitrumSepolia] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  auth: {
    email: true,
    socials: ["google", "x", "github", "discord", "apple"],
    showWallets: true,
    walletFeatures: true
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
});