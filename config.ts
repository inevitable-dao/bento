type Wallet = {
  type: 'erc';
  address: string;
  networks: ('ethereum' | 'klaytn')[];
};

export const wallets: Wallet[] = [
  {
    type: 'erc',
    address: '0x4a003f0a2c52e37138eb646aB4E669C4A84C1001',
    networks: ['ethereum', 'klaytn'],
  },
  {
    type: 'erc',
    address: '0x7777777141f111cf9F0308a63dbd9d0CaD3010C4',
    networks: ['ethereum', 'klaytn'],
  },
  {
    type: 'erc',
    address: '0x6666666854F24DC3cb86feF8F4DC724F34589044',
    networks: ['klaytn'],
  },
  {
    type: 'erc',
    address: '0x9c7377E72564EcD512a68672BA943AB48dBa0415',
    networks: ['klaytn'],
  },
];
