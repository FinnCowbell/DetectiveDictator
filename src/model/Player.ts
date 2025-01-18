import { CardValue } from "./Card";
import { Membership } from "./Membership";

export type PID = number;

export interface Player {
  PID: PID;
  connected: boolean;
  username: string;
  membership: Membership;
  alive: boolean;
  hand?: {
    policies?: CardValue[];
    investigatedMembership?: Membership ;
  };
}