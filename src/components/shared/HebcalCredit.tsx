import { Anchor } from '@mantine/core';

/**
 * The credit that Hebcal's CC BY 4.0 license requires: who made the data, the license, and that we changed it
 * (the caches split combined parshiot and re-key the entries). Rendered inside a <Text> by each caller.
 */
export default function HebcalCredit() {
  return (
    <>
      Torah reading dates, holiday dates and aliyah verse ranges adapted from{' '}
      <Anchor href="https://www.hebcal.com" target="_blank" rel="noopener noreferrer" inherit>
        Hebcal.com
      </Anchor>
      , licensed{' '}
      <Anchor href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" inherit>
        CC BY 4.0
      </Anchor>
      .
    </>
  );
}
