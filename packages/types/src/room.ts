export interface Room {
  id: string;
  title: string;
  description: string;
  inviteCode: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  owner?: {
    username: string;
  };
}
