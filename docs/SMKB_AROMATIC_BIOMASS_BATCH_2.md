# SMKB Aromatic Biomass Batch 2

## Scope

Batch 2 expands the IUVFES Scientific Material Knowledge Base beyond patchouli into aromatic grasses, flowers, spices, and rhizomes that can share parts of the drying/distillation/extraction process family while retaining material-specific evidence.

## Benchmark materials

1. Cymbopogon nardus — citronella / sereh wangi
2. Lavandula angustifolia — lavender
3. Syzygium aromaticum — clove
4. Myristica fragrans — nutmeg / pala
5. Zingiber officinale — ginger / jahe
6. Rosa damascena — rose
7. Jasminum sambac — jasmine / melati
8. Cinnamomum spp. — cinnamon / kayu manis

The earlier Batch 1 remains the base catalog for water, ethanol, glycerol, patchouli, coconut shell and SS316L.

## Important evidence rule

The records in this batch are literature evidence and process-route evidence. They are **not universal material constants** and they are not IUVFES measurements.

A literature observation must retain:

- material identity;
- material state;
- process route;
- process conditions where reported;
- value and unit where reported;
- source;
- source URL;
- evidence grade;
- validation status.

If a source does not provide a property, the catalog keeps that property as a data gap rather than inventing a value.

## Vacuum relevance

Vacuum is not assumed to be appropriate for every material. The catalog distinguishes process routes. Ginger is an explicit benchmark for pulsed-vacuum drying because a peer-reviewed study compared pulsed vacuum drying with other drying methods. Other materials may be suitable for vacuum-assisted or low-temperature processes, but the exact operating envelope must be supported by material/process evidence before being treated as a validated model.

## Why these materials matter

The benchmark set deliberately spans different physical structures:

- leaf/grass: patchouli and citronella;
- flower: lavender, rose, jasmine;
- flower bud/spice: clove;
- seed/aril: nutmeg;
- rhizome: ginger;
- bark: cinnamon.

This allows IUVFES to test whether the process engine generalizes across biomass structures rather than merely fitting patchouli.

## Next data layer

For each benchmark material, the next ingestion pass should prioritize:

1. moisture basis and drying curves;
2. bulk/particle density;
3. particle size;
4. oil/volatile content;
5. cellulose/hemicellulose/lignin/extractives/ash where applicable;
6. Cp(T, moisture);
7. thermal conductivity k(T, moisture);
8. thermal diffusivity;
9. mass-transfer/drying kinetics;
10. extraction kinetics;
11. vapor/liquid or volatile-property data where relevant;
12. uncertainty and replication information.

No property should be promoted to `STANDARD`, `CALIBRATED`, or `VALIDATED` merely because it appears in a publication.

## IUVFES use

The intended chain is:

```text
Literature evidence
      ↓
Material state
      ↓
Property resolver
      ↓
Material physics adapter
      ↓
Thermal / mass / pressure model
      ↓
Digital Twin
      ↓
Real-time or offline simulation
      ↓
Safety / fault propagation
      ↓
Comparison with real experiment
      ↓
Calibration / validation
```
