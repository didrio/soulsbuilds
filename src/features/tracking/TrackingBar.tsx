import { useId, useState } from 'react';
import styled from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Label from '@/components/ui/Label';
import { panel } from '@/components/ui/inWorld';
import { displayText } from '@/components/ui/typography';
import { STATS } from '@/features/editor/sections/StatsCard';
import type { Stats } from '@/lib/buildMath';
import { formatDayMonth } from '@/lib/relativeTime';
import { daysBetween } from '@/lib/tracking';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_ACCENT_LINE,
  COLOR_CELEBRATE,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TINT,
  SPACE_MD,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import ProgressBar from './ProgressBar';
import TrackedAttributes from './TrackedAttributes';
import type { BuildTracking } from './useBuildTracking';

/**
 * The top of the Guide tab while the player tracks the build (T46; tracking lives only there):
 * a compact bar with the progress ("3 of 14 items · Level 62 of 131"), "Your stats" (the attributes
 * with − and +, opened in place under the bar) and "Stop tracking" (asks first: it deletes the
 * progress). At 100%, the "Build complete" moment instead. Nothing when the player doesn't track it.
 */
export function TrackingBar({
  tracking,
  buildName,
  target,
}: {
  tracking: BuildTracking;
  buildName: string;
  /** The build's attributes: what the player's stats are measured against. */
  target: Stats;
}) {
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const statsId = useId();
  const { state, progress, baseline } = tracking;
  if (!state || !progress || !baseline) return null;

  // A finished build leaves the profile's Completed shelf and the build's finished count (T36), so
  // stopping says so.
  const finished = progress.complete && state.completedAt !== null;
  const words = finished
    ? { action: 'Remove from Completed', yes: 'Yes, remove', no: 'Keep it' }
    : { action: 'Stop tracking', yes: 'Yes, stop', no: 'Keep tracking' };
  const stopButton = confirmingStop ? null : (
    <QuietButton variant="ghost" onClick={() => setConfirmingStop(true)}>
      {words.action}
    </QuietButton>
  );
  const confirmStop = confirmingStop ? (
    <Confirm>
      <Question>{`${words.action}? Your progress on this build is deleted.`}</Question>
      <Button
        variant="danger"
        onClick={() => {
          setConfirmingStop(false);
          tracking.stop();
        }}>
        {words.yes}
      </Button>
      <Button variant="secondary" onClick={() => setConfirmingStop(false)}>
        {words.no}
      </Button>
    </Confirm>
  ) : null;

  if (finished && state.completedAt) {
    const days = daysBetween(state.startedAt, state.completedAt);
    return (
      <Complete aria-labelledby="tracking-title">
        <AccentLabel as="p">100%</AccentLabel>
        <CompleteTitle id="tracking-title">Build complete</CompleteTitle>
        <CompleteText>
          {`Every item found, every stat reached. Tracked since ${formatDayMonth(state.startedAt)}: `}
          {days === 1 ? '1 day.' : `${days} days.`}
        </CompleteText>
        <CompleteActions>
          <ShareButton buildName={buildName} />
          <ButtonLink to="/" variant="primary">
            Find your next build
          </ButtonLink>
        </CompleteActions>
        <Centered>{stopButton}</Centered>
        {confirmStop}
        <ErrorMessage>{tracking.error}</ErrorMessage>
      </Complete>
    );
  }

  const { gear, level } = progress;
  return (
    <Bar aria-labelledby="tracking-title">
      <Row>
        <Summary>
          <Line>
            <Label as="h2" id="tracking-title">
              Your progress
            </Label>
            <Percent>{`${progress.percent}%`}</Percent>
          </Line>
          <Counts>
            {gear.total > 0 ? (
              <>
                <strong>{gear.done}</strong> of {gear.total} items ·{' '}
              </>
            ) : null}
            Level <strong>{level.yours}</strong> of {level.target}
          </Counts>
          <ProgressBar percent={progress.percent} />
        </Summary>
        <Actions>
          <Button
            variant="secondary"
            aria-expanded={statsOpen}
            aria-controls={statsId}
            onClick={() => setStatsOpen(!statsOpen)}>
            Your stats
          </Button>
          {stopButton}
        </Actions>
      </Row>
      {confirmStop}
      <StatsPanel id={statsId} hidden={!statsOpen}>
        {statsOpen ? (
          <>
            <StatsNote>Your levels against the build’s, to match your character.</StatsNote>
            <TrackedAttributes
              attributes={STATS}
              target={target}
              tracking={{ stats: state.stats, baseline, onChange: tracking.setStat }}
            />
          </>
        ) : null}
      </StatsPanel>
      <ErrorMessage>{tracking.error}</ErrorMessage>
    </Bar>
  );
}

/**
 * Share the finish: the phone's share sheet when there is one, else the build's link copied. Link
 * previews (T37) will make the shared link show the build.
 */
function ShareButton({ buildName }: { buildName: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href.replace(/\/(loadout|description|route|comments)$/, '');
    const text = `I finished ${buildName} on Souls Builds`;
    if (navigator.share) {
      await navigator.share({ title: buildName, text, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => undefined,
    );
  };
  return (
    <Button variant="secondary" onClick={() => void share()}>
      {copied ? 'Link copied' : 'Share your finish'}
    </Button>
  );
}

const Bar = styled.section`
  ${panel}
  border-color: ${COLOR_ACCENT_LINE};
  padding: 12px 12px 12px 20px;

  @media ${BELOW_MOBILE} {
    padding: 12px 16px;
  }
`;

// The progress, then the buttons on the right; the buttons wrap under it on phones.
const Row = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM} ${SPACE_MD};
`;

const Summary = styled.div`
  flex: 1 1 280px;
  min-width: 0;
`;

const Line = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${SPACE_SM};

  & > h2 {
    margin: 0;
  }
`;

const Percent = styled.span`
  color: ${COLOR_ACCENT};
  font-size: ${TEXT_MD};
  font-variant-numeric: tabular-nums;
  font-weight: 600;
`;

const Counts = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  font-variant-numeric: tabular-nums;
  margin: 2px 0 6px;

  strong {
    color: ${COLOR_TEXT};
    font-weight: 600;
  }
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_XS};
`;

// A quiet, text-sized button; still a 44 px target.
const QuietButton = styled(Button)`
  font-size: ${TEXT_SM};
`;

const StatsPanel = styled.div`
  border-top: 1px solid ${COLOR_LINE};
  margin-top: 12px;
  padding-top: ${SPACE_SM};

  &[hidden] {
    display: none;
  }
`;

const StatsNote = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
  margin: 0 0 ${SPACE_XS};
`;

const Confirm = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  margin: ${SPACE_SM} 0 0;
  text-align: left;
`;

const Question = styled.p`
  color: ${COLOR_TEXT};
  flex-basis: 100%;
  font-size: ${TEXT_SM};
  margin: 0;
`;

const Complete = styled.section`
  ${panel}
  background-image: radial-gradient(ellipse 80% 70% at 50% 30%, ${COLOR_TINT}, transparent 75%);
  border-color: ${COLOR_ACCENT_LINE};
  padding: 20px;
  text-align: center;
`;

const AccentLabel = styled(Label)`
  color: ${COLOR_ACCENT};
`;

const CompleteTitle = styled.h2`
  ${displayText}
  font-size: 2.25rem;
  margin: ${SPACE_XS} 0 0;
  text-shadow: 0 0 24px ${COLOR_CELEBRATE};
`;

const CompleteText = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_MD};
  margin: 6px 0 0;
`;

const CompleteActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  justify-content: center;
  margin-top: 12px;
`;

const Centered = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${SPACE_XS};

  &:empty {
    display: none;
  }
`;
