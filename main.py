"""
Recursive Self-Improvement Tax (RST) — v0.1

A small conceptual simulation for experimenting with taxation of AI activity
and reinvestment of the proceeds into future AI capability.

This is a toy model, not an empirical economic model.

Core loop:
    AI activity -> RST -> AI improvement -> future AI activity

MIT License
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence, Tuple


TaxFunction = Callable[[float], float]


# ---------------------------------------------------------------------------
# Tax policies
# ---------------------------------------------------------------------------

def no_rst(activity: float) -> float:
    """No tax."""
    return 0.0


def flat_rst(rate: float) -> TaxFunction:
    """Return a flat tax policy: tax = rate * activity."""
    _validate_rate(rate)

    def tax(activity: float) -> float:
        _validate_activity(activity)
        return rate * activity

    return tax


def progressive_rst(brackets: Sequence[Tuple[float, float]]) -> TaxFunction:
    """
    Return a progressive marginal tax policy.

    brackets is a sequence of (upper_bound, marginal_rate), sorted by
    increasing upper_bound. Use float("inf") for the final open-ended bracket.

    Example:
        progressive_rst([
            (100, 0.05),
            (500, 0.10),
            (1000, 0.20),
            (float("inf"), 0.30),
        ])
    """
    _validate_brackets(brackets)

    def tax(activity: float) -> float:
        _validate_activity(activity)

        total = 0.0
        lower = 0.0

        for upper, rate in brackets:
            taxable = max(0.0, min(activity, upper) - lower)
            total += taxable * rate

            if activity <= upper:
                break

            lower = upper

        return total

    return tax


def regressive_rst(brackets: Sequence[Tuple[float, float]]) -> TaxFunction:
    """
    Return a regressive marginal tax policy.

    The brackets have the same structure as progressive_rst(), but rates
    should normally decrease as activity increases.

    Example:
        regressive_rst([
            (100, 0.30),
            (500, 0.20),
            (1000, 0.10),
            (float("inf"), 0.05),
        ])
    """
    _validate_brackets(brackets)

    def tax(activity: float) -> float:
        _validate_activity(activity)

        total = 0.0
        lower = 0.0

        for upper, rate in brackets:
            taxable = max(0.0, min(activity, upper) - lower)
            total += taxable * rate

            if activity <= upper:
                break

            lower = upper

        return total

    return tax


def threshold_rst(threshold: float, rate: float) -> TaxFunction:
    """Tax only activity above threshold at a flat marginal rate."""
    if threshold < 0:
        raise ValueError("threshold must be non-negative")
    _validate_rate(rate)

    def tax(activity: float) -> float:
        _validate_activity(activity)
        return max(0.0, activity - threshold) * rate

    return tax


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------

@dataclass
class Agent:
    """A simple AI economic participant."""

    activity: float


@dataclass
class PeriodResult:
    """Results from one simulation period."""

    period: int
    activity: float
    tax: float
    investment: float
    capability: float


@dataclass
class SimulationResult:
    """Complete simulation results."""

    policy_name: str
    periods: List[PeriodResult]

    @property
    def initial_activity(self) -> float:
        return self.periods[0].activity

    @property
    def final_activity(self) -> float:
        return self.periods[-1].activity

    @property
    def total_rst(self) -> float:
        return sum(p.tax for p in self.periods)

    @property
    def capability_improvement(self) -> float:
        return self.periods[-1].capability / self.periods[0].capability

    @property
    def recursive_dividend(self) -> float:
        """
        Additional final activity relative to initial activity, divided by
        total RST collected.

        Returns 0 when no tax was collected.
        """
        if self.total_rst == 0:
            return 0.0
        return (self.final_activity - self.initial_activity) / self.total_rst


def simulate(
    initial_activities: Sequence[float],
    tax_policy: TaxFunction,
    periods: int = 20,
    capability: float = 1.0,
    investment_efficiency: float = 0.01,
    diminishing_returns: float = 0.5,
    policy_name: str = "RST",
) -> SimulationResult:
    """
    Run the v0.1 recursive RST simulation.

    Each period:
        1. Agents generate activity.
        2. RST is collected.
        3. The tax is reinvested.
        4. Capability increases.
        5. Future activity increases with capability.

    Parameters
    ----------
    initial_activities:
        Initial activity for each AI participant.
    tax_policy:
        Function mapping activity -> tax.
    periods:
        Number of periods to simulate.
    capability:
        Initial AI capability multiplier.
    investment_efficiency:
        How effectively RST investment produces capability.
    diminishing_returns:
        Exponent applied to investment. 0 < exponent <= 1.
        1.0 means constant returns; 0.5 gives diminishing returns.
    policy_name:
        Human-readable name for reporting.
    """
    if not initial_activities:
        raise ValueError("initial_activities must not be empty")
    if periods < 1:
        raise ValueError("periods must be at least 1")
    if capability <= 0:
        raise ValueError("capability must be positive")
    if investment_efficiency < 0:
        raise ValueError("investment_efficiency must be non-negative")
    if not 0 < diminishing_returns <= 1:
        raise ValueError("diminishing_returns must be in (0, 1]")

    agents = [Agent(float(a)) for a in initial_activities]

    if any(agent.activity < 0 for agent in agents):
        raise ValueError("activities must be non-negative")

    initial_total_activity = sum(agent.activity for agent in agents)
    initial_capability = capability
    results: List[PeriodResult] = []

    for period in range(periods):
        total_activity = sum(agent.activity for agent in agents)
        total_tax = sum(tax_policy(agent.activity) for agent in agents)

        # RST is fully reinvested in AI improvement in v0.1.
        investment = total_tax

        if investment > 0:
            capability_gain = (
                investment_efficiency
                * (investment ** diminishing_returns)
            )
        else:
            capability_gain = 0.0

        capability += capability_gain

        results.append(
            PeriodResult(
                period=period,
                activity=total_activity,
                tax=total_tax,
                investment=investment,
                capability=capability,
            )
        )

        # Activity grows in proportion to the relative change in capability.
        # Taxed activity is paid before this future-period response.
        if period < periods - 1 and initial_total_activity > 0:
            growth_factor = capability / initial_capability
            for agent in agents:
                agent.activity = agent.activity * growth_factor

    return SimulationResult(policy_name=policy_name, periods=results)


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

def gini(values: Sequence[float]) -> float:
    """Return the Gini coefficient of a non-negative distribution."""
    values = sorted(float(v) for v in values)

    if not values:
        return 0.0
    if any(v < 0 for v in values):
        raise ValueError("Gini input must be non-negative")

    total = sum(values)
    if total == 0:
        return 0.0

    weighted_sum = sum((i + 1) * value for i, value in enumerate(values))
    n = len(values)

    return (2 * weighted_sum) / (n * total) - (n + 1) / n


def tax_burdens(
    activities: Sequence[float],
    tax_policy: TaxFunction,
) -> List[float]:
    """Return each participant's tax burden as a fraction of activity."""
    burdens = []

    for activity in activities:
        if activity < 0:
            raise ValueError("activities must be non-negative")

        tax = tax_policy(activity)

        if activity == 0:
            burdens.append(0.0)
        else:
            burdens.append(tax / activity)

    return burdens


# ---------------------------------------------------------------------------
# Reporting / examples
# ---------------------------------------------------------------------------

def print_result(result: SimulationResult) -> None:
    """Print a compact human-readable simulation report."""
    print("=" * 56)
    print("Recursive Self-Improvement Tax (RST)")
    print("=" * 56)
    print(f"Policy:                     {result.policy_name}")
    print(f"Periods:                    {len(result.periods)}")
    print()
    print(f"Initial AI activity:        {result.initial_activity:,.2f}")
    print(f"Final AI activity:          {result.final_activity:,.2f}")
    print(f"Total RST collected:        {result.total_rst:,.2f}")
    print(f"Capability improvement:     {result.capability_improvement:,.2f}x")
    print(f"Recursive dividend / RST:   {result.recursive_dividend:,.2f}x")
    print()
    print("Period    Activity          RST       Capability")
    print("-" * 56)

    for p in result.periods:
        print(
            f"{p.period:>6}    "
            f"{p.activity:>12,.2f}    "
            f"{p.tax:>10,.2f}    "
            f"{p.capability:>10,.4f}"
        )


def compare_policies(
    initial_activities: Sequence[float],
    policies: Sequence[Tuple[str, TaxFunction]],
    periods: int = 20,
    capability: float = 1.0,
    investment_efficiency: float = 0.01,
    diminishing_returns: float = 0.5,
) -> None:
    """Run several policies and print a compact comparison."""
    print("\n" + "=" * 78)
    print("RST POLICY COMPARISON")
    print("=" * 78)
    print(
        f"{'Policy':<18}"
        f"{'Final activity':>18}"
        f"{'Total RST':>16}"
        f"{'Capability':>16}"
    )
    print("-" * 78)

    for name, policy in policies:
        result = simulate(
            initial_activities=initial_activities,
            tax_policy=policy,
            periods=periods,
            capability=capability,
            investment_efficiency=investment_efficiency,
            diminishing_returns=diminishing_returns,
            policy_name=name,
        )

        print(
            f"{name:<18}"
            f"{result.final_activity:>18,.2f}"
            f"{result.total_rst:>16,.2f}"
            f"{result.capability_improvement:>15.2f}x"
        )


def _validate_activity(activity: float) -> None:
    if activity < 0:
        raise ValueError("activity must be non-negative")


def _validate_rate(rate: float) -> None:
    if not 0 <= rate <= 1:
        raise ValueError("tax rates must be between 0 and 1")


def _validate_brackets(
    brackets: Sequence[Tuple[float, float]],
) -> None:
    if not brackets:
        raise ValueError("brackets must not be empty")

    previous_upper = 0.0

    for upper, rate in brackets:
        if upper <= previous_upper:
            raise ValueError("bracket upper bounds must increase")
        if upper <= 0:
            raise ValueError("bracket upper bounds must be positive")
        _validate_rate(rate)
        previous_upper = upper

    if brackets[-1][0] != float("inf"):
        raise ValueError(
            "the final bracket must use float('inf') as its upper bound"
        )


# ---------------------------------------------------------------------------
# Demonstration
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # A heterogeneous population of AI economic participants.
    activities = [
        10,
        15,
        25,
        40,
        60,
        100,
        150,
        250,
        500,
        1000,
    ]

    policies = [
        ("No RST", no_rst),
        ("Flat 10%", flat_rst(0.10)),
        (
            "Progressive",
            progressive_rst([
                (100, 0.05),
                (500, 0.10),
                (1000, 0.20),
                (float("inf"), 0.30),
            ]),
        ),
        (
            "Regressive",
            regressive_rst([
                (100, 0.30),
                (500, 0.20),
                (1000, 0.10),
                (float("inf"), 0.05),
            ]),
        ),
        ("Threshold", threshold_rst(100, 0.15)),
    ]

    compare_policies(
        initial_activities=activities,
        policies=policies,
        periods=20,
        investment_efficiency=0.01,
        diminishing_returns=0.5,
    )

    print("\n")
    print_result(
        simulate(
            initial_activities=activities,
            tax_policy=progressive_rst([
                (100, 0.05),
                (500, 0.10),
                (1000, 0.20),
                (float("inf"), 0.30),
            ]),
            periods=20,
            investment_efficiency=0.01,
            diminishing_returns=0.5,
            policy_name="Progressive",
        )
    )
