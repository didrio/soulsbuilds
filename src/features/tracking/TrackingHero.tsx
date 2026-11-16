import { useState } from 'react';
import styled, { css } from 'styled-components';
import Button, { ButtonLink } from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import Label from '@/components/ui/Label';
import { CheckIcon } from '@/components/ui/icons';
import { displayText } from '@/components/ui/typography';
import { formatDayMonth } from '@/lib/relativeTime';
import { daysBetween } from '@/lib/tracking';
import {
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_DEEP,
  COLOR_CELEBRATE,
  COLOR_LINE,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  COLOR_TINT,
  SPACE_SM,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import type { BuildTracking } from './useBuildTracking';

/** "Track this build": the build page's primary action (T34). Hidden once tracking. */
export function TrackButton({ tracking }: { tracking: BuildTracking }) {
  if (tracking.loading || tracking.state) return null;
  return (
    <Button onClick={tracking.start}>
      <CheckIcon />
      Track this build
    </Button>
  );
}

/**
 * The hero's tracking block (T34): while in progress, "Your progress" with the percentage, gear as
 * pips and the level as a bar, and "Stop tracking" (asks first: it deletes the progress); at 100%,
 * the "Build complete" moment. Nothing when the player doesn't track the build.
 */
export function TrackingHero({
  tracking,
  buildName,
}: {
  tracking: BuildTracking;
  buildName: string;
}) {
  const [confirmingStop, setConfirmingStop] = useState(false);
  const { state, progress } = tracking;
  if (!state || !progress) return null;

  // "Stop tracking" beside the block's label; it asks first, in a row under it.
  const stopButton = confirmingStop ? null : (
    <StopButton variant="ghost" onClick={() => setConfirmingStop(true)}>
      Stop tracking
    </StopButton>
  );
  const confirmStop = confirmingStop ? (
    <Confirm>
      <Question>Stop tracking? Your progress on this build is deleted.</Question>
      <Button
        variant="danger"
        onClick={() => {
          setConfirmingStop(false);
          tracking.stop();
        }}>
        Yes, stop
      </Button>
      <Button variant="secondary" onClick={() => setConfirmingStop(false)}>
        Keep tracking
      </Button>
    </Confirm>
  ) : null;

  if (progress.complete && state.completedAt) {
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
        <Bottom>{stopButton}</Bottom>
        {confirmStop}
        <ErrorMessage>{tracking.error}</ErrorMessage>
      </Complete>
    );
  }

  const { gear, level } = progress;
  return (
    <Progress aria-labelledby="tracking-title">
      <Top>
        <Label as="h2" id="tracking-title">
          Your progress
        </Label>
        {stopButton}
      </Top>
      {confirmStop}
      <Percent>
        <Big>{`${progress.percent}%`}</Big> complete
      </Percent>
      {gear.total > 0 ? (
        <Line>
          <LineText>
            <span>Gear</span>
            <span>
              <strong>{gear.done}</strong> of {gear.total}
            </span>
          </LineText>
          <Pips aria-hidden="true">
            {Array.from({ length: gear.total }, (_, index) => (
              <Pip key={index} $on={index < gear.done} />
            ))}
          </Pips>
        </Line>
      ) : null}
      <Line>
        <LineText>
          <span>Level</span>
          <span>
            <strong>{level.yours}</strong> of {level.target}
          </span>
        </LineText>
        <Bar aria-hidden="true">
          <Fill style={{ width: `${progress.levelPercent}%` }} />
        </Bar>
      </Line>
      <ErrorMessage>{tracking.error}</ErrorMessage>
    </Progress>
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

// Desktop: a column on the hero's right, behind a rule. Tablets and phones: under the actions.
const block = css`
  align-self: stretch;
  border-left: 1px solid ${COLOR_LINE};
  grid-area: progress;
  padding-left: 24px;

  @media ${BELOW_TABLET} {
    border-left: none;
    border-top: 1px solid ${COLOR_LINE};
    margin-top: 14px;
    padding: 14px 0 0;
  }
`;

const Progress = styled.section`
  ${block}
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 320px;

  @media ${BELOW_TABLET} {
    width: auto;
  }
`;

const Percent = styled.p`
  align-items: baseline;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  gap: 8px;
  margin: 2px 0 0;
`;

const Big = styled.span`
  ${displayText}
  color: ${COLOR_ACCENT};
  font-size: 46px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Line = styled.div`
  margin-top: 10px;
`;

const LineText = styled.p`
  display: flex;
  font-size: ${TEXT_SM};
  justify-content: space-between;
  margin: 0;

  span:last-child {
    color: ${COLOR_TEXT_MUTED};
    font-variant-numeric: tabular-nums;
  }

  strong {
    color: ${COLOR_TEXT};
  }
`;

const Pips = styled.span`
  display: flex;
  gap: 2px;
  margin-top: 5px;
`;

const Pip = styled.span<{ $on: boolean }>`
  background: ${({ $on }) => ($on ? COLOR_ACCENT : COLOR_LINE)};
  border-radius: 1px;
  flex: 1;
  height: 8px;
`;

const Bar = styled.span`
  background: ${COLOR_LINE};
  border-radius: 3px;
  display: block;
  height: 6px;
  margin-top: 5px;
  overflow: hidden;
`;

const Fill = styled.span`
  background: linear-gradient(90deg, ${COLOR_ACCENT_DEEP}, ${COLOR_ACCENT});
  display: block;
  height: 100%;
`;

const Top = styled.div`
  align-items: center;
  display: flex;
  gap: ${SPACE_SM};
  justify-content: space-between;
  min-height: 44px;

  & > h2,
  & > p {
    margin: 0;
  }

  /* The ghost button's text lines up with the block's right edge. */
  & > button {
    margin-right: -14px;
  }
`;

const Bottom = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${SPACE_XS};
`;

// A quiet, text-sized button; still a 44 px target.
const StopButton = styled(Button)`
  font-size: ${TEXT_SM};
`;

const Confirm = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_SM};
  margin: ${SPACE_XS} 0 ${SPACE_SM};
  text-align: left;
`;

const Question = styled.p`
  color: ${COLOR_TEXT};
  flex-basis: 100%;
  font-size: ${TEXT_SM};
  margin: 0;
`;

const Complete = styled.section`
  ${block}
  background-image: radial-gradient(ellipse 80% 70% at 50% 30%, ${COLOR_TINT}, transparent 75%);
  padding-top: 8px;
  text-align: center;
  width: 380px;

  @media ${BELOW_TABLET} {
    width: auto;
  }
`;

const AccentLabel = styled(Label)`
  color: ${COLOR_ACCENT};
`;

const CompleteTitle = styled.p`
  ${displayText}
  font-size: 36px;
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
