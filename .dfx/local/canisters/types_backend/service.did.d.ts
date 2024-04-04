import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'addMilestone' : ActorMethod<
    [
      {
        'id' : string,
        'durationInDays' : bigint,
        'description' : string,
        'tokenReward' : bigint,
      },
    ],
    { 'Ok' : string } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'addUser' : ActorMethod<
    [
      {
        'id' : string,
        'sobrietyDate' : bigint,
        'name' : string,
        'tokens' : bigint,
        'claimedMilestones' : Array<string>,
        'roles' : Array<string>,
      },
    ],
    {
        'Ok' : {
          'id' : string,
          'sobrietyDate' : bigint,
          'name' : string,
          'tokens' : bigint,
          'claimedMilestones' : Array<string>,
          'roles' : Array<string>,
        }
      } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'checkAndRewardMilestones' : ActorMethod<
    [string],
    { 'Ok' : Array<string> } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'getMilestone' : ActorMethod<
    [string],
    {
        'Ok' : {
          'id' : string,
          'durationInDays' : bigint,
          'description' : string,
          'tokenReward' : bigint,
        }
      } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'getUser' : ActorMethod<
    [string],
    {
        'Ok' : {
          'id' : string,
          'sobrietyDate' : bigint,
          'name' : string,
          'tokens' : bigint,
          'claimedMilestones' : Array<string>,
          'roles' : Array<string>,
        }
      } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'mintTokens' : ActorMethod<
    [string, bigint],
    { 'Ok' : string } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'redeemReward' : ActorMethod<
    [string, string],
    { 'Ok' : string } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
  'transferTokens' : ActorMethod<
    [string, string, bigint],
    { 'Ok' : string } |
      { 'Err' : { 'InvalidPayload' : string } | { 'NotFound' : string } }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
