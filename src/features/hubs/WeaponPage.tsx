import { Fragment, lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import NotFound from '@/app/NotFound';
import { useCurrentGame } from '@/app/game';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import Label from '@/components/ui/Label';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import PageHead from '@/components/ui/PageHead';
import PageHero from '@/components/ui/PageHero';
import { TextLink } from '@/components/ui/TextButton';
import { getWeapon, iconUrl, type Weapon } from '@/data';
import {
  indexable,
  tagBySlug,
  tagPath,
  tagSlug,
  weaponBySlug,
  weaponHubMeta,
  weaponUrl,
} from '@/lib/hubs';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SPACE_LG,
  SPACE_MD,
  SPACE_SM,
  TEXT_SM,
} from '@/theme';
import HubBuilds, { firstPageCount } from './HubBuilds';
import { useWeaponBuilds } from './queries';
import { weaponDetail, weaponFacts } from './weaponFacts';

const WhereToFind = lazy(() => import('./WhereToFind'));

/** `/weapons/:slug` (T55): a weapon, what it is, where to find it, and the builds using it. */
function WeaponPage() {
  const { slug = '' } = useParams();
  const card = weaponBySlug(slug);
  const weapon = getWeapon(card?.id);
  if (!weapon) return <NotFound />;
  // Keyed, so moving between weapon pages starts each one fresh.
  return <WeaponHub key={weapon.id} weapon={weapon} />;
}

function WeaponHub({ weapon }: { weapon: Weapon }) {
  const game = useCurrentGame();
  const builds = useWeaponBuilds(weapon.id);
  const count = firstPageCount(builds);
  const facts = weaponFacts(weapon);
  // The weapon type's tag page, when there is one ("Katana" → /tags/katana).
  const typeTag = tagBySlug(tagSlug(facts.kind));
  return (
    <>
      <PageHead
        {...weaponHubMeta(weapon.name, game.name, weaponDetail(weapon))}
        canonical={weaponUrl(weapon.name)}
        noindex={count !== undefined && !indexable(count)}
      />
      <Hero>
        <ItemTile src={iconUrl(weapon.icon)} size={72} />
        <PageHero
          title={`${weapon.name} Builds`}
          tagline={
            <>
              {typeTag ? <KindLink to={tagPath(typeTag)}>{facts.kind}</KindLink> : facts.kind}
              {weapon.dlc ? ' · Shadow of the Erdtree' : ''} · {game.name}
            </>
          }
        />
      </Hero>
      <Panel>
        <Part aria-labelledby="weapon-facts">
          <Label as="h2" id="weapon-facts">
            At a glance
          </Label>
          <Facts>
            {facts.subline ? (
              <>
                <dt>Skill</dt>
                <dd>{facts.subline}</dd>
              </>
            ) : null}
            {facts.rows.map((row) => (
              <Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.parts.map((part) => part.text).join(' · ')}</dd>
              </Fragment>
            ))}
          </Facts>
        </Part>
        <Part aria-labelledby="weapon-where">
          <Label as="h2" id="weapon-where">
            Where to find it
          </Label>
          <Suspense fallback={<LoadingAnimation size={24} />}>
            <WhereToFind weaponId={weapon.id} />
          </Suspense>
        </Part>
      </Panel>
      <HubBuilds
        query={builds}
        heading={`Builds with ${weapon.name}`}
        empty={
          <Empty>
            No builds with {weapon.name} yet.{' '}
            <TextLink to="/build/new">Make the first one</TextLink>
          </Empty>
        }
      />
    </>
  );
}

// Inside the muted tagline: the tagline's color, underlined, brighter on hover.
const KindLink = styled(Link)`
  color: inherit;
  text-decoration: underline;
  text-decoration-color: ${COLOR_TEXT_MUTED};
  text-underline-offset: 3px;

  &:hover {
    color: ${COLOR_TEXT};
  }
`;

const Hero = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${SPACE_MD};

  & > :first-child {
    flex: none;
  }

  @media ${BELOW_MOBILE} {
    align-items: center;
  }
`;

const Panel = styled(Frame)`
  display: grid;
  gap: ${SPACE_LG};
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  margin-top: ${SPACE_LG};

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Part = styled.section`
  display: grid;
  align-content: start;
  gap: ${SPACE_SM};
`;

const Facts = styled.dl`
  display: grid;
  gap: 6px ${SPACE_MD};
  grid-template-columns: max-content minmax(0, 1fr);
  margin: 0;

  & > dt {
    color: ${COLOR_TEXT_MUTED};
    font-size: ${TEXT_SM};
  }

  & > dd {
    color: ${COLOR_TEXT};
    font-size: ${TEXT_SM};
    font-variant-numeric: tabular-nums;
    margin: 0;
  }
`;

const Empty = styled.p`
  color: ${COLOR_TEXT_MUTED};
  margin: 0;
`;

export default WeaponPage;
