export interface Lottery {
  active: boolean;
  createDate: Date;
  updateDate: Date;
  endDate: Date;
  guildId: string;
  ownerId: string;
  allowedUserIds: Array<string>;
  playerIds: Array<string>;
  price: number;
}
