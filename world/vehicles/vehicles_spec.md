# Vehicle and Character Specification

This document defines character persistence, vehicle stages, and transform choreography.

## 1. Visual Baseline

Use these references for style grounding:

- `/assets/map.png`
- `/assets/charlotte.png`
- `/assets/georgia_tech.png`
- `/assets/aquarium.png`
- `/assets/parsons.png`
- `/assets/wisk.png`
- `/assets/fictiv.png`

Style rules:

- low-poly, isometric, matte
- no photoreal materials
- no high-frequency texture detail
- rounded simplified forms

## 2. Persistent Character

Single persistent character across all stages.

Rules:

- slightly oversized head proportion
- simplified beard and glasses geometry
- neutral expression
- cardinal facing updates on direction change
- rotation easing around 120ms
- subtle idle bounce

## 3. Vehicle Stages

### Stage 1: Runner (`runner`)

- Node: Charlotte
- No vehicle
- Running pose with slight forward lean

### Stage 2: Ramblin Wreck (`wreck`)

- Node: Georgia Tech
- Character transitions from runner to seated driver pose

### Stage 3: Parsons Industrial Vehicle (`parsons_truck`)

- Node: Huntsville / Parsons
- Humvee-inspired utility silhouette
- No weapons and no aggressive styling

### Stage 4: Wisk eVTOL (`wisk_evtol`)

- Node: Palo Alto / Wisk
- Fixed-wing, distributed propulsion silhouette
- Rotor spin-up and short vertical lift in idle animation

### Stage 5: Fictiv Modular Manufacturing Mech (`fictiv_mech`)

- Node: San Diego / Fictiv and final SF
- Visible modular manufacturing components

## 4. Side Quest Vehicle Exception

Georgia Aquarium side quest uses whale shark ride presentation.
Main path stage remains `wreck` before and after side quest.

## 5. Transform Choreography

For each stage transition:

- duration: ~500ms
- horizontal spin: 360 degrees
- motion blur active during mid-spin only
- geometry swap at 60% spin progress
- hard landing snap
- small dust puff on contact
- camera micro-zoom from schema transform rules

## 6. Data Wiring

`vehicles.stageByNodeId` is authoritative for active stage selection.
Vehicle state must be derived from completed node progression, not hardcoded conditionals.

## 7. Final State

At San Francisco:

- character can step out for hero composition
- mech remains idle in frame
- fog increased by final progression effects
