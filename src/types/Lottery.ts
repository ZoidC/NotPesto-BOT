export interface Lottery {
  active: boolean;
  createDate: number;
  updateDate: number;
  endDate: number;
  guildId: string;
  ownerId: string;
  allowedUserIds: Array<string>;
  playerIds: Array<string>;
  price: number;
}

export interface Winner {
  playerId: string;
  amount: number;
}
