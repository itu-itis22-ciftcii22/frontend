export type Expr =
  | { type: 'column'; column: string; lag?: number }
  | { type: 'const'; value?: number }
  | { type: 'binary'; op: 'add' | 'sub' | 'mul' | 'div' | 'pow'; left: Expr; right: Expr }
  | { type: 'unary'; op: 'neg' | 'abs'; expr: Expr }

export type RuleNode =
  | { type: 'group'; op: 'all' | 'any' | 'not'; children: RuleNode[] }
  | {
      type: 'condition'
      left: Expr
      comparator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'crosses_above' | 'crosses_below'
      right: Expr
    }

export type ScoreNode =
  | { type: 'constant'; value?: number }
  | {
      type: 'score_group'
      combine: 'weighted_average' | 'min' | 'max'
      children: Array<{ weight?: number; node: ScoreNode }>
    }
  | {
      type: 'metric'
      label?: string
      expr: Expr
      method: 'threshold_distance' | 'percentile_rank'
      direction: 'higher' | 'lower'
      threshold?: number
      target?: number
      window?: number
    }

export const DEFAULT_EXPR: Expr = { type: 'column', column: 'close' }
export const DEFAULT_RULE: RuleNode = { type: 'group', op: 'all', children: [] }
export const DEFAULT_SCORE: ScoreNode = { type: 'constant', value: 1 }

const binarySymbols: Record<Extract<Expr, { type: 'binary' }>['op'], string> = {
  add: '+',
  sub: '-',
  mul: '*',
  div: '/',
  pow: '^',
}

const comparatorLabels: Record<Extract<RuleNode, { type: 'condition' }>['comparator'], string> = {
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  eq: '==',
  neq: '!=',
  crosses_above: 'Crosses Above',
  crosses_below: 'Crosses Below',
}

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export function toNonNegativeInteger(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.trunc(numeric))
}

export function defaultExpression(availableColumns: string[] = []): Expr {
  return { type: 'column', column: availableColumns[0] || 'close' }
}

export function defaultCondition(availableColumns: string[] = []): RuleNode {
  return {
    type: 'condition',
    left: defaultExpression(availableColumns),
    comparator: 'gt',
    right: { type: 'const', value: 0 },
  }
}

export function defaultRule(): RuleNode {
  return clone(DEFAULT_RULE)
}

export function defaultScore(): ScoreNode {
  return clone(DEFAULT_SCORE)
}

export function defaultMetric(availableColumns: string[] = []): ScoreNode {
  return {
    type: 'metric',
    label: 'Higher is stronger',
    expr: defaultExpression(availableColumns),
    method: 'percentile_rank',
    direction: 'higher',
    window: 100,
  }
}

export function formatExpression(expr: Expr | null | undefined): string {
  if (!expr) return 'Select expression'

  if (expr.type === 'column') {
    const lag = toNonNegativeInteger(expr.lag ?? 0)
    return lag > 0 ? `${expr.column} (lag ${lag})` : expr.column
  }

  if (expr.type === 'const') return Number.isFinite(expr.value) ? String(expr.value) : '0'

  if (expr.type === 'unary') {
    if (expr.op === 'neg') return `-${formatExpression(expr.expr)}`
    return `abs(${formatExpression(expr.expr)})`
  }

  return `(${formatExpression(expr.left)} ${binarySymbols[expr.op]} ${formatExpression(expr.right)})`
}

export function normalizeExpression(expr: Expr | null | undefined, availableColumns: string[] = []): Expr {
  if (!expr) return defaultExpression(availableColumns)

  if (expr.type === 'column') {
    return {
      type: 'column',
      column: expr.column || availableColumns[0] || 'close',
      lag: toNonNegativeInteger(expr.lag ?? 0),
    }
  }

  if (expr.type === 'const') {
    const value = Number(expr.value)
    return { type: 'const', value: Number.isFinite(value) ? value : 0 }
  }

  if (expr.type === 'unary') {
    return {
      type: 'unary',
      op: expr.op === 'neg' ? 'neg' : 'abs',
      expr: normalizeExpression(expr.expr, availableColumns),
    }
  }

  return {
    type: 'binary',
    op: binarySymbols[expr.op] ? expr.op : 'add',
    left: normalizeExpression(expr.left, availableColumns),
    right: normalizeExpression(expr.right, availableColumns),
  }
}

export function formatComparator(comparator: Extract<RuleNode, { type: 'condition' }>['comparator']): string {
  return comparatorLabels[comparator] || comparator
}

export function isV2StrategyJson(value: any) {
  return !!value && typeof value === 'object' && value.strategy_version === 2
}

export function buildStrategyV2<T extends Record<string, any>>(strategyJson: T): T {
  return {
    ...strategyJson,
    strategy_version: 2,
    entry_rule: strategyJson.entry_rule || defaultRule(),
    exit_rule: strategyJson.exit_rule || defaultRule(),
    entry_score: strategyJson.entry_score || defaultScore(),
    exit_score: strategyJson.exit_score || defaultScore(),
    thresholds: Array.isArray(strategyJson.thresholds) ? strategyJson.thresholds : [0.5],
    exit_threshold: Number.isFinite(Number(strategyJson.exit_threshold))
      ? Number(strategyJson.exit_threshold)
      : 0.5,
  }
}
