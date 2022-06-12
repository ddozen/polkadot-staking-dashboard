// Copyright 2022 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect, useRef } from 'react';
import Keyring from '@polkadot/keyring';
import {
  getWalletBySource,
  getWallets,
  Wallet,
} from '@talisman-connect/wallets';
import { localStorageOrDefault, setStateWithRef } from 'Utils';
import { DAPP_NAME } from 'consts';
import { APIContextInterface } from 'types/api';
import { ConnectContextInterface } from 'types/connect';
import { MaybeAccount } from 'types';
import { useApi } from './Api';

export const ConnectContext =
  React.createContext<ConnectContextInterface | null>(null);

export const useConnect = () => React.useContext(ConnectContext);

export const ConnectProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { network } = useApi() as APIContextInterface;

  // store accounts list
  const [accounts, setAccounts] = useState<any>([]);
  const accountsRef = useRef(accounts);

  // store the currently active account
  const [activeAccount, _setActiveAccount] = useState<string | null>(null);
  const activeAccountRef = useRef<string | null>(activeAccount);

  // store the currently active account metadata
  const [activeAccountMeta, setActiveAccountMeta] = useState(null);
  const activeAccountMetaRef = useRef(activeAccountMeta);

  // store available extensions in state
  const [extensions, setExtensions] = useState<any>([]);

  // store extensions metadata in state
  const [extensionsStatus, setExtensionsStatus] = useState<any>({});
  const extensionsStatusRef = useRef<any>(extensionsStatus);

  // store unsubscribe handler for connected wallet
  const [unsubscribe, setUnsubscribe]: any = useState([]);
  const unsubscribeRef: any = useRef(unsubscribe);

  // initialise extensions
  useEffect(() => {
    if (!extensions.length) {
      setExtensions(getWallets());
    }
    return () => {
      const _unsubs = unsubscribeRef.current;
      for (const unsub of _unsubs) {
        unsub();
      }
    };
  });

  /* re-sync extensions accounts on network switch
   * do this if activeAccount is present.
   * if activeAccount is present, and extensions have for some
   * reason forgot the site, then all pop-ups will be summoned
   * here. */
  useEffect(() => {
    const _activeAccount: any = localStorageOrDefault(
      `${network.name.toLowerCase()}_active_account`,
      null
    );

    // get account if activeAccount && extensions exist
    if (extensions.length && _activeAccount) {
      (async () => {
        const _unsubs = unsubscribeRef.current;
        for (const unsub of _unsubs) {
          unsub();
        }
        setTimeout(() => connectAllExtensions(), 200);
      })();
    }
  }, [extensions, network]);

  /* connectAllExtensions
   * Loop through extensions and connect to accounts.
   * If `activeAccount` exists locally, we wait until all
   * extensions are looped before connecting to it; there is
   * no guarantee it still exists - must explicitly find it.
   */
  const connectAllExtensions = async () => {
    const keyring = new Keyring();
    keyring.setSS58Format(network.ss58);

    // get and format active account if present
    const _activeAccount: any = getActiveAccountLocal();

    // iterate extensions and add accounts to state
    let extensionsCount = 0;
    const totalExtensions = extensions.length;
    let activeWalletAccount: any = null;

    extensions.forEach(async (_extension: any) => {
      extensionsCount++;
      const { extensionName } = _extension;

      try {
        const extension: Wallet | undefined = getWalletBySource(extensionName);
        if (extension !== undefined) {
          // summons extension popup
          await extension.enable(DAPP_NAME);

          // subscribe to accounts
          const _unsubscribe = await extension.subscribeAccounts(
            (injected: any) => {
              // abort if no accounts
              if (injected.length) {
                // reformat address to ensure correct format
                injected.forEach(async (account: any) => {
                  const { address } = keyring.addFromAddress(account.address);
                  account.address = address;
                  return account;
                });
                // connect to active account if found in extension
                const activeAccountInWallet =
                  injected.find(
                    (item: any) => item.address === _activeAccount
                  ) ?? null;
                if (activeAccountInWallet !== null) {
                  activeWalletAccount = activeAccountInWallet;
                }
                // set active account for network
                if (extensionsCount === totalExtensions) {
                  connectToAccount(activeWalletAccount);
                }
                // remove accounts if they already exist
                let _accounts = [...accountsRef.current].filter(
                  (_account: any) => {
                    return _account.source !== extensionName;
                  }
                );
                // concat accounts and store
                _accounts = _accounts.concat(injected);
                setStateWithRef(_accounts, setAccounts, accountsRef);
              }
            }
          );

          // update context state
          setStateWithRef(
            [...unsubscribeRef.current].concat(_unsubscribe),
            setUnsubscribe,
            unsubscribeRef
          );
        }
      } catch (err) {
        console.error('Extension failed to load');
      }
    });
  };

  /* connectExtensionAccounts
   * Similar to the above but only connects to a single extension.
   * This is invoked by the user by clicking on an extension.
   * If activeAccount is not found here, it is simply ignored.
   */
  const connectExtensionAccounts = async (extensionName: string) => {
    const keyring = new Keyring();
    keyring.setSS58Format(network.ss58);
    const _activeAccount: any = getActiveAccountLocal();
    try {
      const extension: Wallet | undefined = getWalletBySource(extensionName);
      if (extension !== undefined) {
        // summons extension popup
        await extension.enable(DAPP_NAME);

        // subscribe to accounts
        const _unsubscribe = await extension.subscribeAccounts(
          (injected: any) => {
            // abort if no accounts
            if (injected.length) {
              // reformat address to ensure correct format
              injected.forEach(async (account: any) => {
                const { address } = keyring.addFromAddress(account.address);
                account.address = address;
                return account;
              });

              // connect to active account if found in extension
              const activeAccountInWallet =
                injected.find((item: any) => item.address === _activeAccount) ??
                null;
              if (activeAccountInWallet !== null) {
                connectToAccount(activeAccountInWallet);
              }

              // remove accounts if they already exist
              let _accounts = [...accountsRef.current].filter(
                (_account: any) => {
                  return _account.source !== extensionName;
                }
              );
              // concat accounts and store
              _accounts = _accounts.concat(injected);
              setStateWithRef(_accounts, setAccounts, accountsRef);
            }
          }
        );
        // update context state
        setStateWithRef(
          [...unsubscribeRef.current].concat(_unsubscribe),
          setUnsubscribe,
          unsubscribeRef
        );
      }
    } catch (err) {
      console.error('Extension failed to load');
    }
  };

  const setActiveAccount = (address: string | null) => {
    if (address === null) {
      localStorage.removeItem(`${network.name.toLowerCase()}_active_account`);
    } else {
      localStorage.setItem(
        `${network.name.toLowerCase()}_active_account`,
        address
      );
    }
    setStateWithRef(address, _setActiveAccount, activeAccountRef);
  };

  const connectToAccount = (account: any) => {
    setActiveAccount(account?.address ?? null);
    setStateWithRef(account, setActiveAccountMeta, activeAccountMetaRef);
  };

  const disconnectFromAccount = () => {
    localStorage.removeItem(`${network.name.toLowerCase()}_active_account`);
    setActiveAccount(null);
    setStateWithRef(null, setActiveAccountMeta, activeAccountMetaRef);
  };

  const getAccount = (addr: MaybeAccount) => {
    const accs = accountsRef.current.filter((acc: any) => acc.address === addr);
    if (accs.length) {
      return accs[0];
    }
    return null;
  };

  const getActiveAccount = () => {
    return activeAccountRef.current;
  };

  const getActiveAccountLocal = () => {
    const keyring = new Keyring();
    keyring.setSS58Format(network.ss58);

    // get and format active account if present
    let _activeAccount: any = localStorageOrDefault(
      `${network.name.toLowerCase()}_active_account`,
      null
    );
    if (_activeAccount !== null) {
      _activeAccount = keyring.addFromAddress(_activeAccount).address;
    }
    return _activeAccount;
  };

  return (
    <ConnectContext.Provider
      value={{
        connectExtensionAccounts,
        getAccount,
        connectToAccount,
        disconnectFromAccount,
        getActiveAccount,
        extensions,
        extensionsStatus: extensionsStatusRef.current,
        accounts: accountsRef.current,
        activeAccount: activeAccountRef.current,
        activeAccountMeta: activeAccountMetaRef.current,
      }}
    >
      {children}
    </ConnectContext.Provider>
  );
};
