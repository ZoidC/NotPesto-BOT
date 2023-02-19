export type Lottery = {
  active: boolean;
  createDate: number;
  updateDate: number;
  endDate: number;
  guildId: string;
  ownerId: string;
  allowedUserIds: string[];
  playerIds: string[];
  price: number;
};

export type Winner = {
  playerId: string;
  amount: number;
};
