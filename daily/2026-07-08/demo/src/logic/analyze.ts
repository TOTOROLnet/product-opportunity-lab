import type {
  CaseResult,
  CompensationLine,
  LadderStep,
  RegulationCard,
  StrengthFactor,
} from '../types'
import { getScenario } from '../data/scenarios'

// ---------------------------------------------------------------------------
// Deterministic "analysis engine".
//
// In a real product these steps (classify the grievance, match the applicable
// regulation, compute the entitlement, draft the messages, plan the escalation
// strategy) would be done by an LLM grounded on a maintained rules corpus.
// Here they are implemented as transparent, offline, reproducible rules so the
// demo needs no backend / API / secrets. ALL RULES ARE ILLUSTRATIVE.
// ---------------------------------------------------------------------------

type Values = Record<string, string>

function num(values: Values, key: string): number {
  const n = parseFloat(values[key] ?? '')
  return Number.isFinite(n) ? n : 0
}

function pick(values: Values, key: string): string {
  return values[key] ?? ''
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function round(n: number): number {
  return Math.round(n)
}

function money(cur: string, amount: number): string {
  return `${cur}${round(amount).toLocaleString('en-US')}`
}

function verdict(strength: number): string {
  if (strength >= 78) return '很硬 — 值得强势主张，别轻易被劝退'
  if (strength >= 58) return '较硬 — 有据可依，按阶梯逐级施压'
  if (strength >= 38) return '一般 — 建议先补齐证据再谈'
  return '偏弱 — 先固定证据、降低预期后再出手'
}

function strengthFrom(base: number, factors: StrengthFactor[]): number {
  const raw = factors.reduce((acc, f) => acc + f.delta, base)
  return clamp(round(raw), 3, 98)
}

function sumLines(lines: CompensationLine[]): number {
  return round(lines.reduce((acc, l) => acc + l.amount, 0))
}

// --- Flight ----------------------------------------------------------------

function analyzeFlight(cur: string, v: Values): Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'> {
  const distance = pick(v, 'distance')
  const delay = num(v, 'delayHours')
  const reason = pick(v, 'reason')
  const ticket = num(v, 'ticketPrice')

  const baseByDistance = distance === 'short' ? 250 : distance === 'medium' ? 400 : 600
  const qualifies = reason === 'airline' && delay >= 3

  const lines: CompensationLine[] = []
  if (qualifies) {
    let comp = baseByDistance
    let detail = `${distance === 'short' ? '短途' : distance === 'medium' ? '中途' : '长途'}航段，EU261 第7条对应定额 ${money(cur, baseByDistance)}`
    if (distance === 'long' && delay < 4) {
      comp = baseByDistance / 2
      detail = `长途且到达延误介于 3–4 小时，EU261 第7(2)条允许航司减半，${money(cur, baseByDistance)} × 50%`
    }
    lines.push({ label: '定额延误赔偿（EU261 第7条）', detail, amount: comp })
  }
  if (delay >= 4) {
    const care = 40 + (delay >= 8 ? 120 : 0)
    lines.push({
      label: '餐食 / 住宿照料（EU261 第9条）',
      detail: delay >= 8 ? '延误≥8 小时：餐食 €40 + 住宿/接驳 €120（示例估算）' : '延误≥4 小时：餐食约 €40（示例估算）',
      amount: care,
    })
  }

  const factors: StrengthFactor[] = []
  factors.push(
    reason === 'airline'
      ? { label: '延误系航司可控原因（机务 / 运力 / 排班）', delta: 26 }
      : { label: '延误系不可抗力，削弱定额赔偿请求权', delta: -42 },
  )
  factors.push(
    delay >= 3
      ? { label: `到达延误 ${delay} 小时，已跨过 EU261 三小时门槛`, delta: 20 }
      : { label: `延误不足 3 小时，未达定额赔偿门槛`, delta: -46 },
  )
  if (distance === 'long') factors.push({ label: '长途航段，赔偿基数最高', delta: 5 })
  if (ticket > 0) factors.push({ label: '保留了机票与登机 / 延误凭证', delta: 8 })

  const strength = strengthFrom(50, factors)
  const total = sumLines(lines)

  const regulations: RegulationCard[] = [
    {
      code: 'EU261 · 第7条',
      title: '定额延误 / 取消赔偿',
      summary: '符合条件的延误或取消，按航段距离固定赔付 €250 / €400 / €600。',
      appliesWhen: '到达延误≥3 小时且非不可抗力，或未提前充分通知的取消。',
    },
    {
      code: 'EU261 · 第9条',
      title: '照料义务（餐食 / 住宿）',
      summary: '延误期间航司须提供餐食、必要住宿与通讯，此义务不因不可抗力免除。',
      appliesWhen: '延误达到相应时长门槛（随航段而定）。',
    },
    {
      code: 'EU261 · 第5条',
      title: '取消通知与改签',
      summary: '取消须提前充分通知并提供改签 / 退票，否则可能触发定额赔偿。',
      appliesWhen: '航班被取消且通知不足 14 天。',
    },
  ]

  const ladder = buildLadder(cur, total, [
    {
      channel: '航司在线客服 / 客服热线',
      target: '一线客服',
      leverage: 30,
      eta: '当天–3 个工作日',
      goal: `首次提出赔偿请求，点明航班信息、延误时长与 EU261 依据，要求书面答复`,
      reversibility: 'soft',
      reversibilityNote: '口头 / 在线沟通，可随时补充或撤回，几乎无风险。',
      dataShared: ['姓名', '订单号 / PNR', '航班号'],
      draftTitle: '客服沟通话术',
      draft: `你好，我乘坐的航班 [航班号 / 日期] 到达延误 ${delay} 小时，原因据了解为航司可控。根据 EU261 第7条，我有权主张 ${money(cur, total)} 的赔偿及照料补偿。请核实并在 3 个工作日内以书面（邮件）形式答复处理方案。谢谢。`,
    },
    {
      channel: '正式书面索赔函（邮件 + 平台工单）',
      target: '航司客户关系 / 投诉部门',
      leverage: 56,
      eta: '要求 14 天内应答',
      goal: '发出带截止期限的正式索赔，完整援引法规并留痕，为升级铺垫',
      reversibility: 'medium',
      reversibilityNote: '正式书面主张，措辞需准确；发出后请保存副本与发送记录。',
      dataShared: ['姓名', '订单号 / PNR', '航班号', '联系邮箱'],
      draftTitle: '正式索赔邮件',
      draft: `主题：EU261 延误赔偿正式索赔 — [航班号 / 日期]\n\n致 [航司] 客户关系部：\n\n本人搭乘 [航班号]（[日期]）到达延误 ${delay} 小时。依据 EU261 第7条及第9条，现正式主张定额赔偿及照料补偿合计 ${money(cur, total)}。\n随附登机牌、延误证明与费用票据。请于收到本函 14 日内书面答复并支付，逾期我将向监管机构 / 仲裁机构投诉。\n\n[姓名 / 联系方式]`,
    },
    {
      channel: '民航监管 / 消费者仲裁（NEB · ADR · 12326）',
      target: '监管或第三方仲裁机构',
      leverage: 80,
      eta: '数周–数月',
      goal: '航司逾期或拒赔后，提交监管投诉或 ADR 仲裁',
      reversibility: 'hard',
      reversibilityNote: '进入第三方程序属较正式动作，建议确认证据链完整后再提交。',
      dataShared: ['姓名', '身份信息', '订单号 / PNR', '完整时间线证据'],
      draftTitle: '监管 / 仲裁投诉要点',
      draft: `投诉对象：[航司]\n事由：EU261 延误赔偿被拒 / 逾期未处理\n诉求金额：${money(cur, total)}\n关键证据：登机牌、延误证明、此前索赔函与航司答复\n请求：责令航司依 EU261 履行赔偿与照料义务。`,
    },
    {
      channel: '信用卡拒付 / 小额诉讼',
      target: '发卡行 / 法院小额程序',
      leverage: 92,
      eta: '视程序而定',
      goal: '最终手段：对已付款项发起拒付，或提起小额诉讼',
      reversibility: 'hard',
      reversibilityNote: '法律 / 金融程序，成本与门槛最高，作为最后筹码谨慎使用。',
      dataShared: ['姓名', '身份信息', '银行卡 / 支付信息', '完整证据链'],
      draftTitle: '最终手段要点',
      draft: `如前序渠道均无果：\n1) 若用信用卡支付，向发卡行申请争议 / 拒付，附完整往来记录；\n2) 或向法院提起小额诉讼，诉求 ${money(cur, total)} 及必要费用。\n注意：此为最后手段，请评估时间与举证成本。`,
    },
  ])

  const notes = [
    '本案规则为 EU261 的简化示例，实际赔付以承运人所属司法辖区规则与个案事实为准。',
  ]
  if (reason === 'force') notes.push('不可抗力情形下定额赔偿通常不成立，但退票 / 改签与照料义务仍可主张。')
  if (delay < 3) notes.push('当前延误未达 3 小时门槛，定额赔偿请求权较弱，建议聚焦照料与实际损失。')

  return { strength, strengthVerdict: verdict(strength), strengthFactors: factors, total, lines, regulations, ladder, notes }
}

// --- Hotel -----------------------------------------------------------------

function analyzeHotel(cur: string, v: Values): Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'> {
  const nights = num(v, 'nights')
  const rate = num(v, 'roomRate')
  const prepaid = pick(v, 'prepaid')
  const extra = num(v, 'extraCost')

  const lines: CompensationLine[] = []
  if (prepaid === 'yes' && nights > 0 && rate > 0) {
    lines.push({
      label: '已付房费退还',
      detail: `${nights} 晚 × 每晚 ${money(cur, rate)}`,
      amount: nights * rate,
    })
  }
  if (rate > 0) {
    lines.push({
      label: '超售违约补偿（重新安置 + 首晚补偿，示例）',
      detail: '酒店超售属其违约，行业惯例常按首晚房费给予补偿',
      amount: rate,
    })
  }
  if (extra > 0) {
    lines.push({ label: '被迫产生的额外支出补偿', detail: '交通 / 房价差额等实际损失', amount: extra })
  }

  const factors: StrengthFactor[] = []
  factors.push(
    prepaid === 'yes'
      ? { label: '已预付并持有确认单，合同关系明确', delta: 26 }
      : { label: '到店付、无预付凭证，主张力度较弱', delta: -16 },
  )
  factors.push({ label: '酒店超售 / 无法入住属其违约，责任清晰', delta: 15 })
  if (extra > 0) factors.push({ label: '保留了额外支出票据', delta: 8 })

  const strength = strengthFrom(50, factors)
  const total = sumLines(lines)

  const regulations: RegulationCard[] = [
    {
      code: '消费者权益保护法',
      title: '合同违约与先行赔付',
      summary: '经营者未按约定提供服务的，应承担继续履行、退款或赔偿损失等责任。',
      appliesWhen: '已确认预订却被拒绝入住。',
    },
    {
      code: '民法典 · 合同编（示例）',
      title: '违约损害赔偿',
      summary: '违约方应赔偿因违约给对方造成的损失，包括合理的额外支出。',
      appliesWhen: '因超售被迫产生交通 / 差价等实际损失。',
    },
    {
      code: '平台预订保障条款（示例）',
      title: '预订不可入住保障',
      summary: '主流预订平台多设有"到店无房"保障，可协助重新安置并索赔差价。',
      appliesWhen: '通过 OTA 平台完成预订。',
    },
  ]

  const ladder = buildLadder(cur, total, [
    {
      channel: '酒店前台 / 客服',
      target: '值班经理',
      leverage: 30,
      eta: '当场–1 天',
      goal: '当场要求重新安置到同级或更优酒店并承担差价，明确索赔金额',
      reversibility: 'soft',
      reversibilityNote: '现场协商，风险极低，尽量取得书面/录音确认。',
      dataShared: ['姓名', '预订确认号'],
      draftTitle: '现场交涉话术',
      draft: `我持有 [确认号] 的已确认预订，现被告知无房。这属于酒店违约。请立即安排同级或更优酒店入住并承担差价与交通费，并对本次超售给予补偿，合计约 ${money(cur, total)}。请给我书面处理说明。`,
    },
    {
      channel: '预订平台介入（携程 / 美团 / Booking 保障）',
      target: '平台客服 / 保障通道',
      leverage: 56,
      eta: '1–5 天',
      goal: '要求平台按"到店无房"保障介入，先行赔付并向酒店追偿',
      reversibility: 'medium',
      reversibilityNote: '发起平台工单会留痕，建议附齐确认单与现场证据。',
      dataShared: ['姓名', '预订确认号', '联系电话'],
      draftTitle: '平台投诉工单',
      draft: `订单 [确认号] 到店无房，酒店超售违约。请依平台"到店无房"保障先行赔付：退还房费、赔偿差价与额外支出，合计 ${money(cur, total)}，并由平台向酒店追偿。附确认单、现场沟通记录与票据。`,
    },
    {
      channel: '12315 / 消协投诉',
      target: '市场监管 / 消费者协会',
      leverage: 78,
      eta: '数天–数周',
      goal: '酒店与平台均未妥善处理时，提交正式投诉',
      reversibility: 'hard',
      reversibilityNote: '正式行政投诉，建议证据完整后提交。',
      dataShared: ['姓名', '身份信息', '预订与支付凭证'],
      draftTitle: '投诉要点',
      draft: `被投诉方：[酒店 / 平台]\n事由：已确认预订被超售拒绝入住\n诉求：退款 + 差价 + 额外支出补偿共 ${money(cur, total)}\n证据：确认单、支付记录、现场沟通、改住票据。`,
    },
    {
      channel: '信用卡拒付 / 小额诉讼',
      target: '发卡行 / 法院小额程序',
      leverage: 90,
      eta: '视程序而定',
      goal: '最终手段：对预付款发起拒付或提起小额诉讼',
      reversibility: 'hard',
      reversibilityNote: '成本最高的最后筹码，谨慎评估。',
      dataShared: ['姓名', '身份信息', '银行卡 / 支付信息', '完整证据链'],
      draftTitle: '最终手段要点',
      draft: `如协商与投诉均无果：对已预付房费向发卡行申请拒付，或提起小额诉讼主张 ${money(cur, total)} 及必要费用。`,
    },
  ])

  const notes = ['补偿金额为行业惯例的简化示例，实际以合同条款、平台规则与当地法规为准。']
  if (prepaid !== 'yes') notes.push('未预付时退款部分为 0，主张聚焦于超售违约补偿与额外支出。')

  return { strength, strengthVerdict: verdict(strength), strengthFactors: factors, total, lines, regulations, ladder, notes }
}

// --- Broadband -------------------------------------------------------------

function analyzeBroadband(cur: string, v: Values): Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'> {
  const fee = num(v, 'monthlyFee')
  const days = num(v, 'outageDays')
  const reported = pick(v, 'reported')

  const proRated = (fee / 30) * days
  const lines: CompensationLine[] = []
  if (fee > 0 && days > 0) {
    lines.push({
      label: '按天减免月费',
      detail: `月费 ${money(cur, fee)} ÷ 30 天 × 不可用 ${days} 天`,
      amount: proRated,
    })
  }
  if (reported === 'yes' && days >= 7) {
    const penalty = Math.min(proRated * 0.5, fee)
    lines.push({
      label: '持续未修复的违约补偿（示例）',
      detail: '已报障但长期未修复，按减免额的 50% 追加（上限一个月费）',
      amount: penalty,
    })
  }

  const factors: StrengthFactor[] = []
  factors.push(
    reported === 'yes'
      ? { label: '有报障工单记录，故障与时长可举证', delta: 26 }
      : { label: '缺少报障记录，故障时长举证困难', delta: -26 },
  )
  if (days >= 7) factors.push({ label: '故障持续较久，明显影响服务可用性', delta: 15 })
  else factors.push({ label: '故障时长较短，减免额度有限', delta: -4 })

  const strength = strengthFrom(50, factors)
  const total = sumLines(lines)

  const regulations: RegulationCard[] = [
    {
      code: '消费者权益保护法',
      title: '质量不符可要求减价 / 赔偿',
      summary: '服务不符合约定质量的，消费者可要求减少价款或赔偿损失。',
      appliesWhen: '宽带 / 流媒体长期不可用。',
    },
    {
      code: '电信条例 / 服务协议 SLA（示例）',
      title: '服务可用性与降费',
      summary: '运营商对可用性负有义务，长时间故障通常对应按天减费与补偿。',
      appliesWhen: '存在报障记录且未在合理期限修复。',
    },
    {
      code: '工信部申诉受理规则（示例）',
      title: '电信用户申诉',
      summary: '与运营商协商未果的，可向电信用户申诉受理中心申诉。',
      appliesWhen: '已向运营商投诉但未解决。',
    },
  ]

  const ladder = buildLadder(cur, total, [
    {
      channel: '运营商客服（报障 + 减费申请）',
      target: '客服热线 / App 工单',
      leverage: 30,
      eta: '当天–3 天',
      goal: '登记 / 补登报障工单，明确故障时段并申请按天减费与补偿',
      reversibility: 'soft',
      reversibilityNote: '常规客服工单，风险极低，务必记下工单号。',
      dataShared: ['姓名', '宽带账号', '故障时段'],
      draftTitle: '客服话术',
      draft: `我的宽带 [账号] 自 [日期] 起累计不可用 ${days} 天，已多次报障未修复。依消保法，我要求按天减免月费并给予补偿，合计约 ${money(cur, total)}，并请提供报障工单号与预计修复时间。`,
    },
    {
      channel: '正式书面减费 / 赔偿申请',
      target: '运营商投诉受理部门',
      leverage: 55,
      eta: '要求 15 日内答复',
      goal: '提交带工单号与时间线的正式书面主张，为申诉留痕',
      reversibility: 'medium',
      reversibilityNote: '正式书面主张，保存提交回执。',
      dataShared: ['姓名', '宽带账号', '工单号', '联系邮箱'],
      draftTitle: '正式申请',
      draft: `主题：宽带长期故障减费与赔偿正式申请\n账号 [账号] 自 [日期] 累计故障 ${days} 天（工单号 [xxx]）。现主张按天减费与违约补偿合计 ${money(cur, total)}，请于 15 日内书面答复，逾期将向工信部申诉。`,
    },
    {
      channel: '工信部电信用户申诉受理中心 / 12300',
      target: '行业申诉机构',
      leverage: 80,
      eta: '数天–数周',
      goal: '运营商逾期或拒绝后提交行业申诉',
      reversibility: 'hard',
      reversibilityNote: '正式行业申诉，需先完成与运营商的投诉环节。',
      dataShared: ['姓名', '身份信息', '宽带账号', '完整时间线'],
      draftTitle: '申诉要点',
      draft: `被申诉方：[运营商]\n事由：宽带长期故障未妥善减费 / 赔偿\n诉求：${money(cur, total)}\n证据：工单号、故障时段、此前书面申请与答复。`,
    },
    {
      channel: '更换运营商 + 小额诉讼',
      target: '市场选择 / 法院小额程序',
      leverage: 88,
      eta: '视程序而定',
      goal: '最终手段：用脚投票并就损失提起小额诉讼',
      reversibility: 'hard',
      reversibilityNote: '涉及解约与诉讼，评估违约金与举证成本。',
      dataShared: ['姓名', '身份信息', '合同与支付凭证'],
      draftTitle: '最终手段要点',
      draft: `如仍无果：办理携号 / 转网或解约，并就 ${money(cur, total)} 损失提起小额诉讼，附完整证据链。`,
    },
  ])

  const notes = ['减费与补偿为示例算法，实际以服务协议 SLA 与当地法规为准。']
  if (reported !== 'yes') notes.push('缺少报障记录会显著削弱举证，建议尽快补登工单固定故障时段。')

  return { strength, strengthVerdict: verdict(strength), strengthFactors: factors, total, lines, regulations, ladder, notes }
}

// --- Parcel ----------------------------------------------------------------

function analyzeParcel(cur: string, v: Values): Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'> {
  const itemValue = num(v, 'itemValue')
  const insured = pick(v, 'insured')
  const declared = num(v, 'declaredValue')
  const proof = pick(v, 'proof')

  const lines: CompensationLine[] = []
  if (insured === 'yes') {
    const base = declared > 0 ? declared : itemValue
    const payout = Math.min(base, itemValue > 0 ? itemValue : base)
    lines.push({
      label: '按保价金额赔付',
      detail: `保价 ${money(cur, base)}，最高不超过实际损失 ${money(cur, itemValue)}`,
      amount: payout,
    })
  } else {
    const factor = proof === 'yes' ? 0.7 : 0.3
    lines.push({
      label: '未保价按实际损失协商赔付（示例）',
      detail: `未保价受承运合同限额约束，取证${proof === 'yes' ? '充分' : '不足'}约可主张实际价值的 ${factor * 100}%`,
      amount: itemValue * factor,
    })
  }

  const factors: StrengthFactor[] = []
  factors.push(
    insured === 'yes'
      ? { label: '已保价，赔付有合同依据', delta: 26 }
      : { label: '未保价，赔付受承运合同限额约束', delta: -22 },
  )
  factors.push(
    proof === 'yes'
      ? { label: '有开箱视频 / 照片，损坏事实清晰', delta: 18 }
      : { label: '缺少证据，损坏与价值举证困难', delta: -24 },
  )

  const strength = strengthFrom(50, factors)
  const total = sumLines(lines)

  const regulations: RegulationCard[] = [
    {
      code: '邮政法 / 快递暂行条例',
      title: '保价与未保价赔偿',
      summary: '保价的按保价额赔偿；未保价的依民事法律与承运合同确定赔偿。',
      appliesWhen: '快件损毁 / 丢失。',
    },
    {
      code: '消费者权益保护法',
      title: '经营者赔偿责任',
      summary: '服务造成消费者财产损害的，应依法承担赔偿责任。',
      appliesWhen: '快件在承运期间受损。',
    },
    {
      code: '承运合同条款（示例）',
      title: '限额与举证',
      summary: '未保价常设赔偿限额，充分取证有助于突破或接近实际损失。',
      appliesWhen: '未保价且需协商赔付。',
    },
  ]

  const ladder = buildLadder(cur, total, [
    {
      channel: '快递客服（理赔工单）',
      target: '客服 / 网点',
      leverage: 30,
      eta: '当天–3 天',
      goal: '登记理赔工单，提交开箱证据与价值凭证，明确索赔金额',
      reversibility: 'soft',
      reversibilityNote: '常规理赔工单，风险低，记下工单号。',
      dataShared: ['姓名', '运单号', '损坏照片 / 视频'],
      draftTitle: '理赔话术',
      draft: `运单 [运单号] 的快件在运输中${insured === 'yes' ? '损坏/丢失' : '损坏/丢失（未保价）'}。附开箱视频与购买凭证，物品价值 ${money(cur, itemValue)}。请按${insured === 'yes' ? '保价' : '实际损失'}赔付 ${money(cur, total)} 并给出工单号。`,
    },
    {
      channel: '正式书面索赔 + 证据包',
      target: '快递公司理赔部门',
      leverage: 55,
      eta: '要求 7–15 日内答复',
      goal: '提交完整证据包的正式索赔，设定答复期限',
      reversibility: 'medium',
      reversibilityNote: '正式索赔，保存提交回执与证据副本。',
      dataShared: ['姓名', '运单号', '价值凭证', '联系邮箱'],
      draftTitle: '正式索赔函',
      draft: `主题：快件损毁正式索赔 — 运单 [运单号]\n随附开箱视频、购买发票与损坏照片。物品价值 ${money(cur, itemValue)}，主张赔付 ${money(cur, total)}。请于 15 日内书面答复，逾期将向邮政管理部门申诉。`,
    },
    {
      channel: '国家邮政局申诉网站 / 12305',
      target: '邮政监管申诉',
      leverage: 80,
      eta: '数天–数周',
      goal: '快递公司拖延或拒赔后提交监管申诉',
      reversibility: 'hard',
      reversibilityNote: '正式申诉，需先完成与快递公司的投诉环节。',
      dataShared: ['姓名', '身份信息', '运单号', '完整证据'],
      draftTitle: '申诉要点',
      draft: `被申诉方：[快递公司]\n事由：快件损毁 / 丢失未合理赔付\n诉求：${money(cur, total)}\n证据：运单、开箱视频、价值凭证、此前索赔与答复。`,
    },
    {
      channel: '消协 / 小额诉讼',
      target: '消费者协会 / 法院',
      leverage: 88,
      eta: '视程序而定',
      goal: '最终手段：消协调解或小额诉讼',
      reversibility: 'hard',
      reversibilityNote: '成本较高的最后筹码。',
      dataShared: ['姓名', '身份信息', '完整证据链'],
      draftTitle: '最终手段要点',
      draft: `如均无果：向消协申请调解，或提起小额诉讼主张 ${money(cur, total)} 及必要费用。`,
    },
  ])

  const notes = ['赔付比例为示例，实际以保价条款、承运合同限额与举证情况为准。']
  if (insured !== 'yes' && proof !== 'yes') notes.push('未保价且证据薄弱时，实际可拿回金额往往显著低于物品价值。')

  return { strength, strengthVerdict: verdict(strength), strengthFactors: factors, total, lines, regulations, ladder, notes }
}

// --- Subscription ----------------------------------------------------------

function analyzeSubscription(cur: string, v: Values): Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'> {
  const charge = num(v, 'chargeAmount')
  const months = num(v, 'monthsCharged')
  const consent = pick(v, 'consent')
  const used = pick(v, 'used')

  const base = charge * months
  let refundable = base
  let detail = `每期 ${money(cur, charge)} × ${months} 期，未有效告知 / 未使用可主张全额`
  if (used === 'yes' && consent === 'yes') {
    refundable = base * 0.5
    detail = `每期 ${money(cur, charge)} × ${months} 期 × 50%（有告知且有使用，退款范围打折）`
  }
  const lines: CompensationLine[] = [
    { label: '自动续费退款', detail, amount: refundable },
  ]

  const factors: StrengthFactor[] = []
  factors.push(
    consent === 'no'
      ? { label: '开通 / 续费未显著告知，违反自动续费告知义务', delta: 26 }
      : { label: '有明确二次确认，退款主张力度下降', delta: -20 },
  )
  factors.push(
    used === 'no'
      ? { label: '扣费期间基本未使用，无实际获益', delta: 15 }
      : { label: '扣费期间有使用，退款范围可能打折', delta: -10 },
  )

  const strength = strengthFrom(55, factors)
  const total = sumLines(lines)

  const regulations: RegulationCard[] = [
    {
      code: '消费者权益保护法',
      title: '自动续费显著告知义务',
      summary: '采用自动展期的，应以显著方式提请消费者注意，未显著告知的消费者可主张退款。',
      appliesWhen: '开通 / 续费未显著提示或取消入口过深。',
    },
    {
      code: '网络交易监督管理办法（示例）',
      title: '自动展期二次确认',
      summary: '自动展期、自动续费应在扣费前以显著方式提醒并提供便捷取消方式。',
      appliesWhen: '连续扣费前未有效提醒。',
    },
    {
      code: '支付渠道申诉 / 拒付规则（示例）',
      title: '未授权 / 争议交易',
      summary: '对未有效授权的连续扣费，可通过应用商店或支付渠道申诉退款。',
      appliesWhen: '商家拒绝退款时。',
    },
  ]

  const ladder = buildLadder(cur, total, [
    {
      channel: '商家客服（申请退款 + 关闭续费）',
      target: '商家在线客服',
      leverage: 30,
      eta: '当天–3 天',
      goal: '要求关闭自动续费并全额退还未有效告知 / 未使用的扣费',
      reversibility: 'soft',
      reversibilityNote: '常规退款申请，风险极低，截图保存扣费记录。',
      dataShared: ['账号 / 手机号', '订单 / 扣费记录'],
      draftTitle: '退款话术',
      draft: `我在不知情下被连续自动续费 ${months} 期，共 ${money(cur, base)}，开通时未显著告知${used === 'no' ? '且期间基本未使用' : ''}。依消保法，请立即关闭自动续费并退还 ${money(cur, total)}。`,
    },
    {
      channel: '应用商店 / 支付平台申诉',
      target: 'Apple / Google / 微信 / 支付宝',
      leverage: 58,
      eta: '1–7 天',
      goal: '商家不退时，通过扣费渠道申诉未授权 / 争议交易',
      reversibility: 'medium',
      reversibilityNote: '平台申诉会留痕，附扣费记录与沟通截图。',
      dataShared: ['账号', '扣费记录', '与商家沟通截图'],
      draftTitle: '平台申诉',
      draft: `就 [商家 / App] 的自动续费申请退款：连续扣费 ${months} 期共 ${money(cur, base)}，开通未显著告知。请按争议交易处理，退款 ${money(cur, total)}。附扣费与沟通记录。`,
    },
    {
      channel: '12315 / 全国 12315 平台投诉',
      target: '市场监管',
      leverage: 80,
      eta: '数天–数周',
      goal: '商家与平台均未处理时提交正式投诉',
      reversibility: 'hard',
      reversibilityNote: '正式行政投诉，证据完整后提交。',
      dataShared: ['姓名', '身份信息', '扣费与沟通凭证'],
      draftTitle: '投诉要点',
      draft: `被投诉方：[商家]\n事由：自动续费未显著告知、诱导 / 暗扣\n诉求：全额退款 ${money(cur, total)} 并整改\n证据：扣费记录、开通页面截图、客服记录。`,
    },
    {
      channel: '信用卡 / 支付渠道拒付',
      target: '发卡行 / 支付机构',
      leverage: 88,
      eta: '视程序而定',
      goal: '最终手段：对未授权连续扣费发起拒付',
      reversibility: 'hard',
      reversibilityNote: '拒付为最后筹码，可能影响后续该商户交易。',
      dataShared: ['姓名', '身份信息', '银行卡 / 支付信息', '完整证据'],
      draftTitle: '最终手段要点',
      draft: `如仍无果：向发卡行 / 支付机构申请对该连续扣费发起拒付，主张 ${money(cur, total)}，附完整证据。`,
    },
  ])

  const notes = ['退款比例为示例，实际以告知充分度、使用情况与平台规则为准。']
  if (consent === 'yes') notes.push('若确有显著二次确认，全额退款主张会减弱，可聚焦未使用期数。')

  return { strength, strengthVerdict: verdict(strength), strengthFactors: factors, total, lines, regulations, ladder, notes }
}

// --- Ladder builder --------------------------------------------------------

interface LadderSeed {
  channel: string
  target: string
  leverage: number
  eta: string
  goal: string
  reversibility: LadderStep['reversibility']
  reversibilityNote: string
  dataShared: string[]
  draftTitle: string
  draft: string
}

function buildLadder(_cur: string, _total: number, seeds: LadderSeed[]): LadderStep[] {
  return seeds.map((s, i) => ({ id: `rung-${i + 1}`, rung: i + 1, ...s }))
}

// --- Dispatch --------------------------------------------------------------

export function computeCase(scenarioId: string, values: Values): CaseResult | null {
  const scenario = getScenario(scenarioId)
  if (!scenario) return null
  const cur = scenario.currency

  let partial: Omit<CaseResult, 'scenarioId' | 'scenarioName' | 'currency'>
  switch (scenarioId) {
    case 'flight':
      partial = analyzeFlight(cur, values)
      break
    case 'hotel':
      partial = analyzeHotel(cur, values)
      break
    case 'broadband':
      partial = analyzeBroadband(cur, values)
      break
    case 'parcel':
      partial = analyzeParcel(cur, values)
      break
    case 'subscription':
      partial = analyzeSubscription(cur, values)
      break
    default:
      return null
  }

  return { scenarioId, scenarioName: scenario.name, currency: cur, ...partial }
}
