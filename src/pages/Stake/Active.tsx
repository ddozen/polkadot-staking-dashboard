// Copyright 2022 @rossbulat/polkadot-staking-experience authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useMemo } from 'react';
import { PageRowWrapper } from '../../Wrappers';
import { MainWrapper, SecondaryWrapper } from '../../library/Layout';
import { SectionWrapper } from '../../library/Graphs/Wrappers';
import { StatBoxList } from '../../library/StatBoxList';
import { useApi } from '../../contexts/Api';
import { useStaking } from '../../contexts/Staking';
import { useNetworkMetrics } from '../../contexts/Network';
import { useBalances } from '../../contexts/Balances';
import { planckToDot } from '../../Utils';
import { useConnect } from '../../contexts/Connect';
import { Nominations } from './Nominations';
import { ManageBond } from './ManageBond';
import { Button } from '../../library/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedoAlt } from '@fortawesome/free-solid-svg-icons';
import { Separator } from './Wrappers';
import { PageTitle } from '../../library/PageTitle';

export const Active = (props: any) => {

  const { network }: any = useApi();
  const { activeAccount } = useConnect();
  const { getNominationsStatus, staking } = useStaking();
  const { metrics } = useNetworkMetrics();
  const { getAccountLedger, getBondedAccount, getAccountNominations }: any = useBalances();

  const controller = getBondedAccount(activeAccount);
  const ledger = getAccountLedger(controller);
  const nominations = getAccountNominations(activeAccount);
  const { minNominatorBond } = staking;

  // handle nomination statuses
  const [nominationsStatus, setNominationsStatus]: any = useState({
    total: 0,
    inactive: 0,
    active: 0,
  });

  const nominationStatuses = useMemo(() => getNominationsStatus(), [nominations]);

  useEffect(() => {
    let statuses = nominationStatuses;
    let total = Object.values(statuses).length;
    let _active: any = Object.values(statuses).filter((_v: any) => _v === 'active').length;

    setNominationsStatus({
      total: total,
      inactive: total - _active,
      active: _active,
    });
  }, [nominationStatuses]);

  // handle bonded funds 
  const { active } = ledger;

  let { unlocking } = ledger;
  let totalUnlocking = 0;
  for (let i = 0; i < unlocking.length; i++) {
    unlocking[i] = planckToDot(unlocking[i]);
    totalUnlocking += unlocking[i];
  }

  let activeBonded = planckToDot(active);
  let minBond = planckToDot(minNominatorBond);

  let label = activeBonded > minBond
    ? "Intending to Nominate"
    : "Below Minimum Intention";

  let chart1, chart2;
  if (activeBonded > minBond) {
    chart1 = 1;
    chart2 = 0;
  } else {

  }

  const items = [
    {
      label: "Active Nominations",
      value: nominationsStatus.active,
      value2: nominationsStatus.active ? 0 : 1,
      total: nominationsStatus.total,
      unit: '',
      tooltip: `${nominationsStatus.active ? `Active` : `Inactive`}`,
      format: "chart-pie",
    },
    {
      label: "Bonded",
      value: planckToDot(active),
      unit: network.unit,
      format: "number",
    },
    {
      label: "Active Era",
      value: metrics.activeEra.index,
      unit: "",
      format: "number",
    }
  ];

  return (
    <>
      <PageTitle title={props.title} />
      <StatBoxList title="This Session" items={items} />
      <PageRowWrapper noVerticalSpacer>
        <MainWrapper paddingRight style={{ flex: 1 }}>
          <SectionWrapper style={{ height: 290 }} >
            <div className='head'>
              <h4>Status</h4>
              <h2>{nominationsStatus.active ? 'Active and Earning Rewards' : 'Waiting for Active Nominations'}</h2>
              <Separator />
              <h4>Reward Destination</h4>
              <h2>
                <FontAwesomeIcon
                  icon={faRedoAlt}
                  transform='shrink-4'
                />
                &nbsp;Back to Staking &nbsp;<div><Button thin inline primary title='Update' /></div>
              </h2>
            </div>
          </SectionWrapper>
        </MainWrapper>
        <SecondaryWrapper style={{ height: 290 }}>
          <SectionWrapper >
            <ManageBond />
          </SectionWrapper>
        </SecondaryWrapper>
      </PageRowWrapper>
      <PageRowWrapper noVerticalSpacer>
        <SectionWrapper>
          <Nominations />
        </SectionWrapper>
      </PageRowWrapper>
    </>
  );
}

export default Active;