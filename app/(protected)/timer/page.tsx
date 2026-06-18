import { TimerManager } from "@/components/timer/TimerManager";
import { ACTIVITIES } from "@/lib/constants";
import { getActiveTimer, getTimerHistory } from "@/lib/services/timer";
import { requireModuleAccess } from "@/lib/services/module-permissions";

export const dynamic = "force-dynamic";

export default async function TimerPage() {
  const session = await requireModuleAccess("TIMER");

  const [activeTimer, history] = await Promise.all([
    getActiveTimer(session.userId),
    getTimerHistory(session.userId),
  ]);

  return (
    <TimerManager
      initialTimer={activeTimer}
      history={history}
      activities={ACTIVITIES}
    />
  );
}
