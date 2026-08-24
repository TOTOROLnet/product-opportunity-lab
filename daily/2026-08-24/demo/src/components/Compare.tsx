import { useMemo, useState } from 'react';
import type { WorkloadProfile } from '../types';
import { DEFAULT_PROFILE, SCENARIOS } from '../data/scenarios';
import { evaluate, fmtMoney, fmtPct } from '../lib/costModel';
import { advise } from '../lib/advisor';

// 三条真实世界路线：本地(AutoClaw) / 云端常驻(Epho) / 边缘按需(Construct)。
const COMPARE_IDS = ['local', 'cloud-persistent', 'edge-ondemand'] as const;

export function Compare() {
  const [profileId, setProfileId] = useState<string>('research');
  const profile: WorkloadProfile = useMemo(() => {
    if (profileId === 'default') return { ...DEFAULT_PROFILE };
    return { ...(SCENARIOS.find((s) => s.id === profileId)?.profile ?? DEFAULT_PROFILE) };
  }, [profileId]);

  const { results, usage, sweetSpotId } = useMemo(() => evaluate(profile), [profile]);
  const advice = useMemo(
    () => advise(profile, results, usage, sweetSpotId),
    [profile, results, usage, sweetSpotId],
  );
  const byId = Object.fromEntries(results.map((r) => [r.arch.id, r]));

  return (
    <div className="compare">
      <p className="page-intro">
        选一个创业画像，横向对比报告里三条真实路线——把 agent 的「电脑」放在
        <b>本地</b>（AutoClaw 路子）、<b>云端常驻</b>（Epho 路子）还是
        <b>边缘按需</b>（Construct 路子）。同一份需求，甜点会随场景漂移。
      </p>

      <div className="profile-picker">
        <span>切换画像：</span>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            className={`scenario-chip ${profileId === s.id ? 'active' : ''}`}
            onClick={() => setProfileId(s.id)}
          >
            {s.name}
          </button>
        ))}
        <button
          className={`scenario-chip ${profileId === 'default' ? 'active' : ''}`}
          onClick={() => setProfileId('default')}
        >
          默认画像
        </button>
      </div>

      <div className="compare-cols">
        {COMPARE_IDS.map((id) => {
          const r = byId[id];
          return (
            <article key={id} className={`compare-card ${r.isSweetSpot ? 'sweet' : ''}`}>
              <header>
                <h4>{r.arch.name}</h4>
                {r.isSweetSpot && <span className="badge sweet-badge">本画像甜点</span>}
              </header>
              <p className="ref-product">参照：{r.arch.refProduct}</p>
              <table className="compare-table">
                <tbody>
                  <tr>
                    <td>毛利率</td>
                    <td className={r.marginPct < 0 ? 'neg' : 'pos'}>{fmtPct(r.marginPct)}</td>
                  </tr>
                  <tr>
                    <td>月基础设施成本</td>
                    <td>{fmtMoney(r.infraCost)}</td>
                  </tr>
                  <tr>
                    <td>每活跃用户成本</td>
                    <td>${r.costPerActiveUser.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>冷启动延迟</td>
                    <td>{(r.arch.coldStartMs / 1000).toFixed(1)}s</td>
                  </tr>
                  <tr>
                    <td>隔离 / 可靠</td>
                    <td>
                      {r.arch.isolation} / {r.arch.reliability}
                    </td>
                  </tr>
                  <tr>
                    <td>风险调整推荐分</td>
                    <td className={r.isSweetSpot ? 'pos' : ''}>{r.recommendationScore.toFixed(0)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="lock-note">{r.arch.lockInNote}</p>
              {r.arch.capabilityGap && <p className="gap-note">⚠ {r.arch.capabilityGap}</p>}
            </article>
          );
        })}
      </div>

      <div className="advisor">
        <h4>
          顾问解读 · before / after <span className="mock-tag">脚本化模拟 · 非真实 LLM 调用</span>
        </h4>
        <ul>
          {advice.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
