// The weapon page's "Where to find it" (T55). Its own chunk: the acquisition data is ~400 KB, like the
// Guide's (GuideSection), so the page shows first and this fills in.
import styled from 'styled-components';
import Label from '@/components/ui/Label';
import { acquisition } from '@/data/acquisition';
import { COLOR_LINE_STRONG, COLOR_TEXT, COLOR_TEXT_MUTED, SPACE_SM, TEXT_SM } from '@/theme';
import { whereToFind, type FindStop } from './findStops';

const where = (stop: FindStop) => (stop.place ? `${stop.area} · ${stop.place}` : stop.area);

/** Where the weapon is, then what opens the way there (the Guide's gates), in route order. */
function WhereToFind({ weaponId }: { weaponId: number }) {
  const stops = whereToFind(weaponId, acquisition);
  if (!stops.length) return <Muted>Where it comes from isn’t in our data yet.</Muted>;
  const gives = stops.filter((stop) => stop.gives);
  const before = stops.filter((stop) => !stop.gives);
  return (
    <>
      <Stops>
        {gives.map((stop, index) => (
          <Stop key={index}>
            <Label>{where(stop)}</Label>
            <How>{stop.how}</How>
          </Stop>
        ))}
      </Stops>
      {before.length ? (
        <Before>
          <Muted>On the way, as the Guide routes it:</Muted>
          <Steps>
            {before.map((stop, index) => (
              <li key={index}>
                {stop.how} <Place>({where(stop)})</Place>
              </li>
            ))}
          </Steps>
        </Before>
      ) : null}
    </>
  );
}

const Stops = styled.ul`
  display: grid;
  gap: ${SPACE_SM};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Stop = styled.li`
  border-left: 2px solid ${COLOR_TEXT};
  display: grid;
  gap: 2px;
  padding-left: 12px;
`;

const How = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_SM};
`;

const Before = styled.div`
  border-left: 2px solid ${COLOR_LINE_STRONG};
  display: grid;
  gap: 4px;
  padding-left: 12px;
`;

const Steps = styled.ol`
  color: ${COLOR_TEXT};
  display: grid;
  font-size: ${TEXT_SM};
  gap: 2px;
  margin: 0;
  padding-left: 1.4em;
`;

const Place = styled.span`
  color: ${COLOR_TEXT_MUTED};
`;

const Muted = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0;
`;

export default WhereToFind;
