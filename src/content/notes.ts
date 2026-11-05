/**
 * Verification notes: every lesson was rebuilt as a geometric simulation; where the paper could not do what the
 * original text said, the instruction was corrected. Notes are shown on each tutorial and collected on /notes.
 */
export interface Note {
  id: string;
  /** what the textbook said */
  was: string;
  /** what is correct, and why */
  now: string;
  kind: 'correction' | 'clarification' | 'confirmed';
}

export const NOTES: Note[] = [
  {
    id: 'square-from-rect',
    kind: 'confirmed',
    was: 'Fold the top-left corner down until the top edge lies along the right edge; cut off the strip.',
    now: 'Confirmed. The crease runs at 45° from the top-right corner; the strip below the triangle is 87 mm on A4 and 2.5 in on Letter.',
  },
  {
    id: 'warmup',
    kind: 'clarification',
    was: 'The pleat: “fold the new edge back on itself as a mountain”.',
    now: 'Clarified: after folding an edge to the centre, fold the flap back so its edge returns to the outside. The two creases form a Z when seen from the side.',
  },
  {
    id: 'cup',
    kind: 'confirmed',
    was: 'The first side crease starts “roughly two-fifths of the way along the base”.',
    now: 'Confirmed by construction: the crease that makes the flap’s top edge level starts at 2√2 − 2 ≈ 0.83 of the half-base, i.e. 41% of the base. The second tip lands exactly where the first crease ends.',
  },
  {
    id: 'cup',
    kind: 'correction',
    was: 'Step 5: “Turn the model over and tuck the second triangle in the same way.”',
    now: 'Both side flaps are folded to the front, so the back has no pocket. The second triangle is simply folded down against the back.',
  },
  {
    id: 'cup',
    kind: 'clarification',
    was: 'Step 4: tuck the triangle “into the pocket between the two flaps”.',
    now: 'It goes into the pocket of the front flap — between that flap’s two layers. The triangle fits it exactly.',
  },
  {
    id: 'boat',
    kind: 'correction',
    was: 'Step 1 does not say how to hold the sheet; on a landscape A4 sheet the corner folds in step 3 run off the bottom edge.',
    now: 'Start with the sheet portrait (short edges at top and bottom). After folding the top edge down to the bottom edge, the 45° corner folds leave a 44 mm band on A4, which is what the brim needs.',
  },
  {
    id: 'boat',
    kind: 'clarification',
    was: 'Step 4 folds each brim up, then step 5 opens the hat into a diamond.',
    now: 'On A4 or Letter the brim is wider than the triangle, so its corners overhang. Fold the overhanging corners behind along the triangle’s edges after each brim; otherwise they stick out across the diamond when the hat is opened.',
  },
  {
    id: 'boat',
    kind: 'clarification',
    was: 'Step 7: pull the two upper points apart and flatten the base.',
    now: 'Every step up to the small diamond is simulated, including both “open and flatten” moves, which turn out to be a rigid one-degree-of-freedom linkage. The final pull-apart is shown with arrows only: its 3D shape could not be checked against the original tutorial here.',
  },
  {
    id: 'fortune-teller',
    kind: 'clarification',
    was: 'Step 6: “Lift the tip of each flap and slide a thumb and finger under it.”',
    now: 'Fingers go into the four pockets under the coloured squares on the outside, not under the numbered triangle flaps.',
  },
  {
    id: 'preliminary-base',
    kind: 'correction',
    was: '…with the four free corners at the bottom and two layers on each face.',
    now: 'The finished base has two flaps on each side (four layers per side). Each face shows one flat layer.',
  },
  {
    id: 'waterbomb-base',
    kind: 'correction',
    was: '…a closed point at the top and two layers of paper on each face.',
    now: 'Two flaps on each face, each flap two layers thick.',
  },
  {
    id: 'rabbit-ear',
    kind: 'correction',
    was: 'Crease the two angle bisectors of one end… Pinch a third crease from that point to the opposite edge.',
    now: 'Bisect the two angles at the ends of one edge (fold each slanted edge onto that edge). The bisectors meet inside the triangle. Fold both at once; the third corner rises as a flap, which you pinch in half and lay to one side.',
  },
  {
    id: 'balloon',
    kind: 'correction',
    was: 'Step 2: “bring the bottom edges of the two upper flaps in toward the centre line.”',
    now: 'Fold the bottom corners of the two front flaps up to the top point. This turns the front into a square diamond.',
  },
  {
    id: 'balloon',
    kind: 'correction',
    was: 'Step 5: “Tuck each side flap into the pocket just below it.”',
    now: 'It is the small top triangles that are tucked: fold each one again along the top edge of the side flap and slide it into that flap’s pocket. It fits exactly.',
  },
  {
    id: 'heart',
    kind: 'correction',
    was: 'The eight heart steps (bottom edge to centre, “fold the two upper edges down to the vertical centre crease”, white triangles “lifted so they do not crease”) do not describe a sequence that can be folded: after step 4 the paper is a kite with no top flap.',
    now: 'Replaced with a traditional heart whose every step was simulated: diamond, top corner to centre, bottom corner to the top edge, lower edges up along the centre line, then four small folds to round the lobes.',
  },
  {
    id: 'bird-base',
    kind: 'confirmed',
    was: 'Kite folds, top triangle down, unfold, petal fold front and back.',
    now: 'Confirmed. The kite creases meet the top fold exactly at the side points, so the petal fold flattens with no gaps.',
  },
  {
    id: 'crane',
    kind: 'correction',
    was: 'Flapping: hold the crane at the base of the neck and pull the tail gently. The wings flap.',
    now: 'The narrowed neck and tail lock the crane’s wings. Flapping is the traditional flapping bird: skip the narrowing in step 2, reverse-fold the neck and tail, then pull the tail.',
  },
  {
    id: 'masu-box',
    kind: 'correction',
    was: 'The finished box is about 5.5 × 5.5 × 3 cm.',
    now: 'From 15 cm paper the box is 15 ÷ (2√2) ≈ 5.3 cm square and half that, about 2.7 cm, tall.',
  },
  {
    id: 'sonobe',
    kind: 'clarification',
    was: 'Step 8: “On both the top and bottom edges, fold from one corner to the other along the edge and unfold.”',
    now: 'Turn the unit over and fold each sharp point across until its edge lies along the long edge of the unit, making a square in the middle; unfold. These creases become the tabs.',
  },
];

export const notesFor = (id: string) =>
  NOTES.filter((n) => n.id === id).map(
    (n) =>
      `<span class="note-kind note-${n.kind}">${n.kind}</span> ${n.now}${n.kind !== 'confirmed' ? ` <span class="note-was">Textbook: “${n.was}”</span>` : ''}`,
  );
