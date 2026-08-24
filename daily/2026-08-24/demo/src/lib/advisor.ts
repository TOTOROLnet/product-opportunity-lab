import type { ArchResult, UsageDerived, WorkloadProfile } from '../types';
import { fmtInt, fmtMoney, fmtPct, stressScan } from './costModel';

// 脚本化「顾问解读」：从确定性数值套模板生成中文自然语言诊断。
// 这是对「真实产品会用 LLM 给出的架构诊断」的示意，**不是**真实 LLM 调用（纯前端、不接外部 API）。
export function advise(
  p: WorkloadProfile,
  results: ArchResult[],
  usage: UsageDerived,
  sweetSpotId: string | null,
): string[] {
  const byId = Object.fromEntries(results.map((r) => [r.arch.id, r]));
  const sweet = sweetSpotId ? byId[sweetSpotId] : null;
  const cloud = byId['cloud-persistent'];
  const edge = byId['edge-ondemand'];
  const vps = byId['self-vps'];
  const local = byId['local'];

  const lines: string[] = [];

  if (sweet && sweet.marginPct >= 0) {
    lines.push(
      `在你当前画像（${fmtInt(p.mau)} 活跃用户、定价 $${p.pricePerMonth}/月、闲置比 ${fmtPct(
        p.idleRatio * 100,
      )}）下，风险调整后的甜点架构是「${sweet.arch.name}」：毛利率约 ${fmtPct(
        sweet.marginPct,
      )}，月基础设施成本约 ${fmtMoney(sweet.infraCost)}。`,
    );
  } else if (sweet) {
    lines.push(
      `⚠ 危险信号：当前画像下连最优的「${sweet.arch.name}」都是负毛利（约 ${fmtPct(
        sweet.marginPct,
      )}）。你的定价 $${p.pricePerMonth}/月撑不住这套用量，先调价或设配额，别急着选架构。`,
    );
  }

  if (p.idleRatio >= 0.5) {
    lines.push(
      `闲置比偏高（${fmtPct(
        p.idleRatio * 100,
      )}）：云端常驻会为「开着但没干活」的时间持续付费，其毛利仅约 ${fmtPct(
        cloud.marginPct,
      )}；边缘按需「用完即散」，闲置几乎不计费，毛利约 ${fmtPct(
        edge.marginPct,
      )}——这正是报告里「只有真的有人干活账单才走」的价值所在。`,
    );
  } else {
    lines.push(
      `闲置比不高（${fmtPct(
        p.idleRatio * 100,
      )}）：常驻类架构的闲置浪费有限，云端常驻（毛利约 ${fmtPct(
        cloud.marginPct,
      )}）用常热机换来低冷启动与强隔离，往往比边缘按需（毛利约 ${fmtPct(
        edge.marginPct,
      )}）更划算。此时别为「用完即散」牺牲体验。`,
    );
  }

  if (p.burstMultiplier >= 3.5) {
    lines.push(
      `并发峰值倍数高达 ${p.burstMultiplier.toFixed(
        1,
      )}×：自建 VPS 需按峰值预置实例、谷段大量闲置，毛利被压到约 ${fmtPct(
        vps.marginPct,
      )}——高波动负载不适合固定预置。`,
    );
  }

  // 用压力扫描找「鲸鱼放大」维度上的毛利转负点，把「来了不回的用户」风险量化。
  const whaleScan = stressScan(p, 'whaleAmplify');
  const edgeWhaleCross = whaleScan.crossing['edge-ondemand'];
  if (p.whaleRatio >= 0.12) {
    lines.push(
      `约 ${fmtPct(p.whaleRatio * 100)} 的「来了不回」重度用户（放大 ${p.whaleAmplify.toFixed(
        0,
      )}×）在吞噬用量驱动的成本${
        edgeWhaleCross != null
          ? `：即便最省的边缘按需，鲸鱼放大到约 ${edgeWhaleCross.toFixed(1)}× 时也会转负`
          : ''
      }。平价订阅 + 用量成本错配是毛利断崖的主因，务必设配额或分层定价。`,
    );
  }

  // 用户规模维度：说明毛利大体与规模无关（除 VPS 的最小实例摊薄外），破除「长大就转正/转负」的错觉。
  lines.push(
    `注意：单位经济是否成立主要由「用量形态 + 定价」决定，而不是用户数——把用户从 ${fmtInt(
      p.mau,
    )} 翻几倍，各架构毛利率大体不变（自建 VPS 因最小实例摊薄，在规模上略有改善）。别指望「长大了就自动盈利」。`,
  );

  lines.push(
    `别忘了三难权衡：本地客户端最省（厂商成本约 ${fmtMoney(
      local.infraCost,
    )}），但${local.arch.capabilityGap ?? '有能力缺口'}；边缘按需省钱但冷启动约 ${(
      edge.arch.coldStartMs / 1000
    ).toFixed(1)}s 且${edge.arch.lockInNote}。没有免费的午餐，只有适配你场景的甜点。`,
  );

  return lines;
}
