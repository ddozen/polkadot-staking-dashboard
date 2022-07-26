// Copyright 2022 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { PayoutListContextInterface } from 'pages/Pools/types';

export const PayoutListContext: React.Context<PayoutListContextInterface> =
  React.createContext({
    setListFormat: (v: string) => {},
    listFormat: 'col',
  });

export const usePayoutList = () => React.useContext(PayoutListContext);

export const PayoutListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [listFormat, _setListFormat] = useState('col');

  const setListFormat = (v: string) => {
    _setListFormat(v);
  };

  return (
    <PayoutListContext.Provider
      value={{
        setListFormat,
        listFormat,
      }}
    >
      {children}
    </PayoutListContext.Provider>
  );
};
