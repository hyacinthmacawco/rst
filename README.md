# Recursive Self-Improvement Tax

Recursive Self-Improvement Tax (RST) is a tax on AI activity, as in, some amount of AI usage is given to improving AI itself.

This project is for experimenting with different RST structures—flat, progressive, regressive, threshold-based, and custom—and examining their effects on AI growth, inequality, tax burden, and recursive returns.

This is a deliberately simple toy model rather than a prediction of real-world AI economics.

## Quick start

The repository contains one Python file:

```text
main.py
```

The demonstration compares:

* No RST
* Flat RST
* Progressive RST
* Regressive RST
* Threshold RST

It then prints the results of a progressive RST simulation in more detail.

Import the simulator:

```python
from rst import (
    simulate,
    flat_rst,
    progressive_rst,
)
```

Define some AI activity:

```python
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
```

Define a tax policy:

```python
policy = flat_rst(0.10)
```

Run the simulation:

```python
result = simulate(
    initial_activities=activities,
    tax_policy=policy,
    periods=20,
)
```

Inspect the results:

```python
print(result.final_activity)
print(result.total_rst)
print(result.capability_improvement)
print(result.recursive_dividend)
```

Several policies can be compared directly:

```python
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
]
```

Then:

```python
compare_policies(
    initial_activities=activities,
    policies=policies,
    periods=20,
)
```

The resulting comparison makes it possible to ask questions such as:

* Which policy produces the most future AI activity?
* Which collects the most RST?
* Which produces the greatest capability improvement?
* Which reduces inequality?
* Which places the greatest burden on high-activity participants?

## Included tax structures

### No RST

The counterfactual baseline.

```python
no_rst
```

### Flat RST

Everyone pays the same percentage of activity.

```python
flat_rst(0.10)
```

This represents a 10% RST.

### Progressive RST

The marginal tax rate increases with activity.

```python
progressive_rst([
    (100, 0.05),
    (500, 0.10),
    (1000, 0.20),
    (float("inf"), 0.30),
])
```

### Regressive RST

The marginal tax rate decreases with activity.

```python
regressive_rst([
    (100, 0.30),
    (500, 0.20),
    (1000, 0.10),
    (float("inf"), 0.05),
])
```

### Threshold RST

Activity below a threshold is untaxed.

```python
threshold_rst(100, 0.15)
```

This taxes activity above 100 at a 15% marginal rate.

### Custom RST

A tax policy is simply a Python function:

```python
def my_rst(activity):
    return ...

result = simulate(
    initial_activities=activities,
    tax_policy=my_rst,
)
```

This makes it possible to experiment with arbitrary tax schedules without changing the simulation itself.

## Model

For each period, the simulation performs the following sequence:

1. AI participants generate activity.
2. RST is calculated from that activity.
3. RST is collected.
4. The entire RST proceeds are reinvested into AI.
5. AI capability increases.
6. Future AI activity increases according to the improved capability.

In simplified form:

$$
A_t \rightarrow T_t \rightarrow I_t \rightarrow C_{t+1}
\rightarrow A_{t+1}
$$

where:

* $A$ = AI activity
* $T$ = RST collected
* $I$ = AI investment
* $C$ = AI capability

RST is assumed to be fully reinvested:

$$
I_t=T_t
$$

and investment can exhibit diminishing returns:

$$
\Delta C = \alpha I^\beta
$$

where $0 < \beta \leq 1\$.

## Metrics

The simulation provides several basic measures.

### Total RST

The cumulative amount collected:

$$
T=\sum_t T_t
$$

### Capability improvement

The change in AI capability over the simulation.

### Recursive dividend

A simple measure of additional activity generated relative to RST collected:

$\text{Recursive Dividend} = \frac{A_{\text{final}}-A_{\text{initial}}} {T_{\text{total}}}$

This asks how much additional AI activity is associated with each unit of RST collected?

### Gini coefficient

The model includes a Gini coefficient for examining inequality in the distribution of AI activity.

This allows tax policies to be evaluated not only according to how much they collect, but also according to their distributional consequences.

### Tax burden

For each participant:

$$
\text{Tax burden}_i =
\frac{T_i}{A_i}
$$

This makes it possible to compare the distribution of tax burdens under different policies.

## License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for the full text.
