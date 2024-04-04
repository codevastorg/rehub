export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addMilestone' : IDL.Func(
        [
          IDL.Record({
            'id' : IDL.Text,
            'durationInDays' : IDL.Nat64,
            'description' : IDL.Text,
            'tokenReward' : IDL.Nat64,
          }),
        ],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'durationInDays' : IDL.Nat64,
              'description' : IDL.Text,
              'tokenReward' : IDL.Nat64,
            }),
            'Err' : IDL.Variant({
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
            }),
          }),
        ],
        [],
      ),
    'addUser' : IDL.Func(
        [
          IDL.Record({
            'id' : IDL.Text,
            'sobrietyDate' : IDL.Nat64,
            'name' : IDL.Text,
            'tokens' : IDL.Nat64,
            'claimedMilestones' : IDL.Vec(IDL.Text),
            'roles' : IDL.Vec(IDL.Text),
          }),
        ],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'sobrietyDate' : IDL.Nat64,
              'name' : IDL.Text,
              'tokens' : IDL.Nat64,
              'claimedMilestones' : IDL.Vec(IDL.Text),
              'roles' : IDL.Vec(IDL.Text),
            }),
            'Err' : IDL.Variant({
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
            }),
          }),
        ],
        [],
      ),
    'getMilestone' : IDL.Func(
        [IDL.Text],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'durationInDays' : IDL.Nat64,
              'description' : IDL.Text,
              'tokenReward' : IDL.Nat64,
            }),
            'Err' : IDL.Variant({
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
            }),
          }),
        ],
        ['query'],
      ),
    'getUser' : IDL.Func(
        [IDL.Text],
        [
          IDL.Variant({
            'Ok' : IDL.Record({
              'id' : IDL.Text,
              'sobrietyDate' : IDL.Nat64,
              'name' : IDL.Text,
              'tokens' : IDL.Nat64,
              'claimedMilestones' : IDL.Vec(IDL.Text),
              'roles' : IDL.Vec(IDL.Text),
            }),
            'Err' : IDL.Variant({
              'InvalidPayload' : IDL.Text,
              'NotFound' : IDL.Text,
            }),
          }),
        ],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
