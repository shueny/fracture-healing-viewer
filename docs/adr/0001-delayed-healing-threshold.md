# 0001 Delayed-healing threshold 1.1 mm

Date: 2026-10-09 · Status: accepted

## Context

The PRD slows healing (τ = 6, τc = 8) when the initial interfragmentary movement (IFM) is above a threshold. Initial IFM = 0.8 · k_load / k_nail gives 0.80, 0.64, 1.28 and 1.024 mm for the four scenarios. With the original 1.0 mm threshold, both full-loading scenarios were delayed, but the PRD text says only "full loading + thin nail" should be.

## Options

1. Raise the threshold to 1.1 mm.
2. Raise k_nail for the 11 mm nail to at least 1.3.
3. Keep 1.0 mm and change the PRD text.

## Decision

Option 1 (owner). Only 10 mm + full loading (1.28 mm) is delayed.

## Consequences

The coefficients keep their simple ratios. The 11 mm + full case (1.024 mm) is close to the threshold, so any later change to the coefficients must re-check this table (PRD, "示意資料模型").
