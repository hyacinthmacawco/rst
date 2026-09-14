# Recursive Self-Improvement Tax Simulator

Recursive Self-Improvement Tax (RST) is a tax on AI activity, as in, some amount of AI usage is given to improving AI itself.

This project is an interactive web-based simulator for experimenting with different RST structures—flat, progressive, regressive, threshold-based, and custom—and examining their effects on AI growth, inequality, tax burden, and recursive returns.

**This is a deliberately simple toy model rather than a prediction of real-world AI economics.**

## Quick Start

Open [`index.html`](index.html) in your web browser to launch the interactive simulator. No installation or dependencies required!

## Features

The simulator includes:

### Interactive Controls
- **Tax Policy Selector**: Choose from No RST, Flat, Progressive, Regressive, Threshold, or Custom policies
- **Adjustable Parameters**: 
  - Tax rates and brackets
  - Initial AI activities
  - Number of simulation periods
  - Investment efficiency
  - Diminishing returns coefficient

### Visual Outputs
- **Real-time Metrics Cards**: Display final activity, total RST collected, capability improvement, recursive dividend, and Gini coefficient
- **Activity & Capability Chart**: Line chart showing how total activity and AI capability evolve over time
- **Tax Collection Chart**: Bar chart displaying RST collected per period
- **Policy Comparison**: Compare all policy types side-by-side in table or chart view

### Included Tax Structures

#### No RST
The counterfactual baseline—no tax is collected.

#### Flat RST
Everyone pays the same percentage of activity (e.g., 10%).

#### Progressive RST
The marginal tax rate increases with activity. Configure custom brackets with different thresholds and rates.

#### Regressive RST
The marginal tax rate decreases with activity. Higher activity participants pay lower rates.

#### Threshold RST
Activity below a threshold is untaxed; activity above is taxed at a flat rate.

#### Custom RST
Define your own tax schedule by modifying the bracket configurations.

## Model

For each period, the simulation performs the following sequence:

1. AI participants generate activity
2. RST is calculated from that activity
3. RST is collected
4. The entire RST proceeds are reinvested into AI
5. AI capability increases
6. Future AI activity increases according to the improved capability

In simplified form:

```
A_t → T_t → I_t → C_{t+1} → A_{t+1}
```

where:
- **A** = AI activity
- **T** = RST collected
- **I** = AI investment
- **C** = AI capability

RST is assumed to be fully reinvested:

```
I_t = T_t
```

and investment can exhibit diminishing returns:

```
ΔC = α × I^β
```

where 0 < β ≤ 1.

## Metrics

The simulation provides several measures for evaluating policies:

### Total RST
The cumulative amount collected over all periods.

### Capability Improvement
The change in AI capability over the simulation (expressed as a multiplier).

### Recursive Dividend
A measure of additional activity generated relative to RST collected:

```
Recursive Dividend = (A_final - A_initial) / T_total
```

This asks: how much additional AI activity is associated with each unit of RST collected?

### Gini Coefficient
Measures inequality in the distribution of AI activity among participants:
- 0 = perfect equality
- 1 = maximum inequality

This allows tax policies to be evaluated not only according to how much they collect, but also according to their distributional consequences.

### Tax Burden
For each participant:

```
Tax Burden_i = T_i / A_i
```

This enables comparison of the distribution of tax burdens under different policies.

## Questions to Explore

Use the simulator to investigate questions such as:

- Which policy produces the most future AI activity?
- Which collects the most RST?
- Which produces the greatest capability improvement?
- Which reduces inequality (lowers the Gini coefficient)?
- Which places the greatest burden on high-activity participants?
- How do diminishing returns affect optimal policy design?
- What is the trade-off between growth and equality?

## Technical Details

This is a vanilla HTML/JavaScript implementation using:
- **Chart.js** (loaded via CDN) for data visualization
- No frameworks or build tools required
- Runs entirely in the browser

## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for the full text.
