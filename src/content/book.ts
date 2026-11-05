/**
 * The Complete Origami Textbook — content, restructured for the web.
 * Lessons with step-by-step instructions are animated tutorials (see catalog.ts); everything else lives here.
 * Where the simulation showed an instruction could not be folded as written, the text below is corrected
 * (see notes.ts for the record).
 */

export interface Practice {
  model: string;
  grade: string;
  time: string;
  trains: string;
  url: string;
  designer?: string;
}

export interface Level {
  n: number;
  name: string;
  grade: string;
  goal: string;
  skills: string;
  capstone: string;
  /** tutorial id used as the level's picture */
  hero: string;
  intro?: string;
  /** extra written sections (HTML) shown after the tutorials */
  sections: { title: string; html: string }[];
  practiceNote?: string;
  practice: Practice[];
  practice2?: { title: string; note?: string; rows: Practice[] };
  check: string[];
}

const om = (slug: string) => `https://origami.me/${slug}/`;

export const RULES = [
  ['Fold every model three times.', 'The first teaches the sequence, the second the feel, the third the precision.'],
  ['Crease each fold firmly', 'and press it flat before the next step. Early accuracy decides how the last steps go.'],
  ['Read one step ahead', 'in the diagram, and use the animation for any step where the paper moves in a way you cannot picture.'],
  ['Practise on cheap paper,', 'then repeat the model on good paper.'],
  ['Move up when the skill check feels easy,', 'not before. Staying a level longer is never wasted.'],
];

export const LEVELS: Level[] = [
  {
    n: 0,
    name: 'Foundations',
    grade: 'Not graded',
    goal: 'Prepare good paper and basic tools, cut a perfect square from a rectangle, read an origami diagram, and name every basic fold.',
    skills: 'Paper, tools, squares, fold vocabulary, diagram symbols',
    capstone: 'A square cut from printer paper',
    hero: 'square-from-rect',
    sections: [
      {
        title: 'Choosing paper',
        html: `<p>Paper weight is measured in GSM (grams per square metre). Lower GSM is thinner and easier to fold but tears more readily; higher GSM is stronger but harder to fold sharply. Ordinary printer paper is about 90–100 GSM, which is why it feels stiff for small models. Start with kami or foil and practise on kraft. The full table is on the <a href="#/paper">paper page</a>.</p>
        <p>Avoid cheap construction paper sold as origami paper: it is usually too thick and often not square. Trusted brands include Taro, Toyo, Aitoh and Jong Ie Nara.</p>
        <p><b>Sizes.</b> Most tutorials use a 15 × 15 cm (6 × 6 in) square. Very small models, such as the corner bookmark, use 10 cm. Larger paper makes every model easier; if a step feels cramped, double the size.</p>`,
      },
      {
        title: 'Tools',
        html: `<ul class="ticks"><li>A hard, flat, clean table.</li><li>A bone folder or the back of a spoon to sharpen creases (a fingernail also works).</li><li>A ruler and a very light pencil for the few models that need measured folds.</li><li>A paper trimmer, or a craft knife with a cutting mat, to cut true squares.</li><li>Tweezers or a toothpick for tiny tucks, and paper clips to hold layers still.</li></ul>`,
      },
      {
        title: 'Reading a diagram',
        html: `<p>Each diagram shows the paper after one step, with the next fold marked on it. The notation most diagrams follow was introduced by Akira Yoshizawa and refined by Samuel Randlett and Robert Harbin — the Yoshizawa–Randlett system. Every animation on this site draws those symbols first, then folds. See <a href="#/folds">folds &amp; symbols</a> for the full key.</p>`,
      },
      {
        title: 'Creasing habits',
        html: `<ul class="ticks"><li>Match corners first, then edges, then press from the centre outward.</li><li>Crease once, cleanly. Re-folding a crease weakens the paper.</li><li>Pre-crease (fold and unfold) wherever a diagram says to; those creases guide the collapse later.</li><li>Keep layers aligned when a step folds several at once; hold them with your free hand.</li><li>Count flaps after finishing a base. A wrong count means a mistake earlier.</li></ul>`,
      },
    ],
    practice: [],
    check: [
      'Cut a square from A4 or Letter whose diagonals fold edge to edge with no gap.',
      'Fold a square in half four times and keep the edges aligned within 1 mm.',
      'Explain, with a scrap of paper, the difference between a valley and a mountain fold.',
      'Take any diagram and say aloud what the first five symbols mean.',
    ],
  },
  {
    n: 1,
    name: 'First Folds',
    grade: 'Very Easy · Beginner Level 1',
    goal: 'Fold three simple models cleanly from memory, using only valley folds, mountain folds and a few reference creases.',
    skills: 'Aligning edges and corners, creasing sharply, folding to a centre line, pleats, opening a pocket and tucking a flap.',
    capstone: 'Paper boat, cup, fortune teller',
    hero: 'cup',
    intro: 'Most models at this grade fold in under five minutes.',
    sections: [],
    practiceNote: 'Every model below is graded Very Easy. Fold them in the order shown.',
    practice: [
      { model: 'Bookmark', grade: 'Very Easy', time: 'under 1 min', trains: 'Precise small folds, tucking', url: om('bookmark') },
      { model: 'Water Bomb', grade: 'Very Easy', time: 'under 5 min', trains: 'Collapsing a base (previews Level 2)', url: om('waterbomb') },
      { model: 'Swan', grade: 'Very Easy', time: 'under 5 min', trains: 'Folds to a centre line, neck and head shaping', url: om('swan') },
      { model: 'Fox', grade: 'Very Easy', time: 'under 5 min', trains: 'A simple animal face', url: om('fox') },
      { model: 'Penguin', grade: 'Very Easy', time: 'under 5 min', trains: 'A simple animal', url: om('penguin') },
      { model: 'Christmas Tree', grade: 'Very Easy', time: 'under 5 min', trains: 'A seasonal shape', url: om('christmas-tree') },
      { model: 'Star', grade: 'Very Easy', time: 'under 5 min', trains: 'Symmetry', url: om('star') },
      { model: 'Witch Hat', grade: 'Very Easy', time: 'under 5 min', trains: 'A seasonal shape', url: om('witch-hat') },
      { model: 'Paper Envelope', grade: 'Very Easy', time: 'under 5 min', trains: 'Overlapping flaps', url: om('paper-envelope') },
      { model: 'Bird', grade: 'Very Easy', time: '5–10 min', trains: 'Folding a simple animal body', url: om('bird') },
    ],
    check: [
      'Fold the cup, boat and fortune teller without a diagram, each in under 5 minutes.',
      'Every flap sits flat with no gaps wider than a millimetre.',
      'Fold two practice models using only the video, then once using only the diagram.',
      'Explain, for each model, which folds were valley and which were mountain.',
    ],
  },
  {
    n: 2,
    name: 'Building Skills',
    grade: 'Very Easy to Easy · Levels 1–2',
    goal: 'Fold the kite, preliminary and waterbomb bases accurately, perform a squash fold and a rabbit ear, and finish two models that use them.',
    skills: 'Pre-creasing, collapsing a flat sheet into a base, squash fold, rabbit ear, tucking a flap into a pocket, inflating a model.',
    capstone: 'Waterbomb balloon',
    hero: 'balloon',
    sections: [
      {
        title: 'What a base is',
        html: `<p>A base is a standard folded shape that many models start from. Learn the bases once and you can fold whole families of models from them. There are six traditional ones: this level teaches the kite, preliminary and waterbomb bases (and the fish base, through the rabbit-ear drill); the bird base is Level 3 and the frog base Level 6.</p>
        <div class="table-wrap"><table><thead><tr><th>Base</th><th>Shape</th><th>Made by</th><th>Used for</th></tr></thead><tbody>
        <tr><td><a href="#/fold/kite-base">Kite</a></td><td>Kite</td><td>Folding two edges to the centre diagonal</td><td>Fish, simple faces</td></tr>
        <tr><td><a href="#/fold/preliminary-base">Preliminary (square)</a></td><td>Small square on a point</td><td>Collapsing along midlines and diagonals</td><td>Crane, lily, frog</td></tr>
        <tr><td><a href="#/fold/waterbomb-base">Waterbomb</a></td><td>Triangle</td><td>The same creases with directions swapped</td><td>Balloon, tulip, lotus</td></tr>
        <tr><td><a href="#/fold/rabbit-ear">Fish</a></td><td>Long diamond with two small flaps</td><td>Two rabbit ears on opposite sides</td><td>Traditional fish</td></tr>
        <tr><td><a href="#/fold/bird-base">Bird</a></td><td>Long diamond with legs</td><td>Preliminary base plus petal folds</td><td>Crane and other birds</td></tr>
        <tr><td>Frog</td><td>Four long legs</td><td>Preliminary base plus squash and petal folds on each flap</td><td>Frog, lily, complex models</td></tr>
        </tbody></table></div>`,
      },
    ],
    practice: [
      { model: 'Dog', grade: 'Easy (Level 2)', time: 'under 5 min', trains: 'Pleats and a reverse-style head', url: om('dog') },
      { model: 'Rose', grade: 'Very Easy', time: '5–10 min', trains: 'A flower', url: om('rose') },
      { model: 'Ninja Star', grade: 'Very Easy', time: '5–10 min', trains: 'A classic star shape', url: om('ninja-star') },
      { model: '3D Butterfly', grade: 'Very Easy', time: '5 min', trains: 'An insect model', url: om('yoshizawa-butterfly') },
      { model: 'Lotus', grade: 'Easy', time: '5–10 min', trains: 'Petals from a base', url: om('lotus') },
      { model: 'Elephant', grade: 'Very Easy', time: 'under 5 min', trains: 'A simple animal', url: om('elephant') },
      { model: 'Cube', grade: 'Very Easy', time: '15 min', trains: 'Modular assembly; see Level 4', url: om('cube') },
    ],
    check: [
      'Fold the kite, preliminary and waterbomb bases in under two minutes each, corners meeting exactly.',
      'State which creases are mountains and which are valleys for each base.',
      'Fold the heart and the balloon without the diagram.',
      'Do a clean squash fold and a clean rabbit ear on scrap paper.',
    ],
  },
  {
    n: 3,
    name: 'Classics',
    grade: 'Easy · Beginner Level 3',
    goal: 'Fold the bird base, perform inside reverse folds, and complete the crane, the masu box and a jumping frog.',
    skills: 'Petal fold, inside and outside reverse folds, folding several layers at once, raising walls, building spring tension.',
    capstone: 'Crane, masu box',
    hero: 'crane',
    intro: 'Level 3 is where origami starts to feel like a craft: the models are recognisable, the folds are many, and accuracy compounds.',
    sections: [
      {
        title: 'The jumping frog',
        html: `<p>The <a href="${om('jumping-frog')}" target="_blank" rel="noopener" class="ext">jumping frog</a> runs to 22 steps, so it is a test of reading a longer diagram. Its pleated back legs store energy like a spring: press the back, slide your finger off, and it leaps. Tips that apply to every spring-loaded model:</p>
        <ul class="ticks"><li>Use 15 × 15 cm kami for the best jump. A rectangle gives fewer layers but a lower hop.</li><li>Hold all the layers still before the step that stacks them.</li><li>Lift loose flaps clear of the work area before folding past them.</li><li>The paper gets thick near the end, so smooth, even springs matter more than sharp creases.</li></ul>`,
      },
      {
        title: 'The tulip: inflating and shaping',
        html: `<p>The <a href="${om('tulip')}" target="_blank" rel="noopener" class="ext">tulip</a> builds on the waterbomb base. If it will not inflate, pinch the top while blowing, or pull opposite sides to stretch the paper. Thin kami tears less. Pull out the four outer layers to make petals.</p>`,
      },
    ],
    practice: [
      { model: 'Turtle', grade: 'Easy', time: '5–10 min', trains: 'A simple animal', url: om('turtle') },
      { model: 'Rabbit', grade: 'Easy', time: '10 min', trains: 'A simple animal', url: om('rabbit') },
      { model: 'Squirrel', grade: 'Easy', time: '10 min', trains: 'A simple animal', url: om('squirrel') },
      { model: 'Bat', grade: 'Easy', time: 'under 5 min', trains: 'A quick symmetrical model', url: om('bat') },
      { model: 'Envelope', grade: 'Easy', time: '10 min', trains: 'Overlapping flaps that lock', url: om('envelope') },
      { model: 'Sitting Crane', grade: 'Easy', time: '10 min', trains: 'A crane variation', url: om('sitting-crane') },
      { model: 'Dove', grade: 'Easy', time: '5 min', trains: 'A bird', url: om('dove') },
      { model: 'Hummingbird', grade: 'Easy', time: '10–15 min', trains: 'A bird', url: om('hummingbird') },
      { model: 'Butterfly', grade: 'Easy', time: '5–10 min', trains: 'An insect', url: om('butterfly') },
      { model: 'Candy Box', grade: 'Easy', time: '5–10 min', trains: 'Box folding', url: om('candy-box') },
      { model: 'Sanbou Box', grade: 'Easy', time: '5–10 min', trains: 'Traditional offering stand', url: om('sanbou-box') },
      { model: 'Basket', grade: 'Easy', time: '10 min', trains: 'A container', url: om('basket') },
    ],
    check: [
      'Fold a crane in under 8 minutes without a diagram, wings level and the head neatly turned.',
      'Fold a masu box and lid that fit together.',
      'Do an inside reverse fold and an outside reverse fold on scrap paper.',
      'Fold the jumping frog and make it jump at least 30 cm.',
    ],
  },
  {
    n: 4,
    name: 'Modular and Flowers',
    grade: 'Easy (Level 4) to Challenging Easy',
    goal: 'Fold a model from several identical units without glue, and fold a flower with a built-up multi-step base.',
    skills: 'Making identical units, locking tabs into pockets, working from a pre-creased grid, curling and shaping petals.',
    capstone: 'Sonobe cube, lily',
    hero: 'sonobe',
    sections: [
      {
        title: 'Why modular origami is a new skill',
        html: `<p>Until now one sheet made one model. In modular origami many identical sheets — units or modules — are folded the same way and joined by sliding a tab into a pocket on the next unit. No glue is needed: the units hold each other by friction and geometry.</p>
        <ul class="ticks"><li>Make every unit identically. A mirrored unit will not fit.</li><li>Crease sharply. Small errors multiply across 6, 12 or 30 units.</li><li>Assemble flat on a desk first, then form the curved shape.</li></ul>
        <p><b>Colour planning.</b> With three colours and two units of each, opposite faces match. For a two-colour cube with solid sides, use four units of one colour and two of the other.</p>`,
      },
      {
        title: 'More units, more shapes',
        html: `<p>The same Sonobe unit (Mitsunobu Sonobe, late 1960s) builds 12- and 30-unit stars. The <a href="${om('kusudama-sonobe-star')}" target="_blank" rel="noopener" class="ext">Kusudama Sonobe Star</a> uses 12 units to form a stellated octahedron, with larger versions at 30, 90 or 120 units. Folding a kusudama is mostly repetition, so settle into a rhythm and keep the creases uniform.</p>`,
      },
      {
        title: 'The lily: a multi-step flower',
        html: `<p>The <a href="${om('lily')}" target="_blank" rel="noopener" class="ext">lily</a> (20 steps) shows how a flower is built from a base and then shaped. The traditional lily starts from a <a href="#/fold/preliminary-base">preliminary base</a>: squash-fold each of the four flaps (<a href="#/fold/squash-fold">the squash drill</a>), petal-fold each one (as in the <a href="#/fold/bird-base">bird base</a>) — which gives the frog base — then narrow the petals with folds to the centre line, fold them down, and curl them.</p>
        <p>Hold the layers with a bone folder at the tricky top angle; roll petal tips gently between your fingers; curl the petals around a pen for a natural look.</p>`,
      },
    ],
    practice: [
      { model: '5-Pointed Star', grade: 'Very Easy', time: '10 min', trains: 'A star', url: om('5-pointed-star') },
      { model: '4-Pointed Star', grade: 'Easy', time: '10 min', trains: 'A star', url: om('4-pointed-star') },
      { model: '6-Pointed Star', grade: 'Challenging Easy', time: '10–15 min', trains: 'A star', url: om('6-pointed-star') },
      { model: 'Crystal Ornament', grade: 'Easy', time: '10 min', trains: 'A decoration', url: om('crystal-ornament') },
      { model: 'Kusudama Chrysanthemum', grade: 'Easy', time: '60 min', trains: 'A flower from many petals', url: om('kusudama-chrysanthemum') },
      { model: 'Hydrangea', grade: 'Easy', time: '30 min', trains: 'A flower', url: om('hydrangea') },
      { model: 'Iris', grade: 'Easy', time: '10–15 min', trains: 'A flower', url: om('iris') },
      { model: 'Camellia', grade: 'Easy', time: '5 min', trains: 'A flower', url: om('camellia') },
      { model: '5-Petal Lily', grade: 'Challenging Easy', time: '15 min', trains: 'Five-fold symmetry', url: om('5-petal-lily') },
      { model: 'Bellflower', grade: 'Easy', time: '15 min', trains: 'A flower', url: om('bellflower') },
      { model: 'Hexagonal Box', grade: 'Low-Intermediate', time: '20 min', trains: 'Six-sided box', url: om('hexagonal-box'), designer: 'Nick Robinson' },
    ],
    check: [
      'Assemble a Sonobe cube from six units without clips, with no loose tab.',
      'Fold six units that are identical when stacked.',
      'Fold the lily with petals that are even and curled naturally.',
      'Choose a colour plan for a cube before folding and carry it out.',
    ],
  },
  {
    n: 5,
    name: 'Shaping',
    grade: 'Challenging Easy to Low-Intermediate',
    goal: 'Fold detailed animals and objects of 10 to 20 minutes, read a long diagram with confidence, and shape a flat fold into a form with curves, heads, tails and legs.',
    skills: 'Outside reverse folds, crimps, swivel folds, pleats for texture, folding through several layers, sequence planning.',
    capstone: 'Dragon, cat, shark',
    hero: 'crimp-pleat',
    intro: 'The Challenging Easy grade sits between Easy and Low-Intermediate: the folds are still basic, but there are more of them and they need to be placed more carefully.',
    sections: [
      {
        title: 'Swivel folds and reading layers',
        html: `<p><b>Swivel fold.</b> A flap swings around a crease that forms as the paper moves. Pre-crease the lines, lift the flap, and let the paper rotate while you flatten it. Check the layers on the far side.</p>
        <p><b>Reading layers.</b> Before each step, count the layers you are about to fold. If the diagram says to fold one layer and you fold two, the model locks up later.</p>`,
      },
      {
        title: 'Fold one animal in three passes',
        html: `<p>Pick the <a href="${om('dragon')}" target="_blank" rel="noopener" class="ext">dragon</a> or the <a href="${om('cat')}" target="_blank" rel="noopener" class="ext">cat</a> and fold it three times.</p>
        <ol class="passes"><li><b>Follow the video.</b> Pause at each step, fold, and compare your paper with the screen.</li><li><b>Follow the diagram only.</b> Note every place you got stuck.</li><li><b>Fold from memory.</b> Look only at the stuck points. Then shape the model: round the back, curve the tail, adjust the head.</li></ol>
        <p>Then choose a second animal that uses the same folds, such as the <a href="${om('lion')}" target="_blank" rel="noopener" class="ext">lion</a>, and notice what carries over.</p>`,
      },
      {
        title: 'Shaping a finished model',
        html: `<ul class="ticks"><li>Round a flat body by pressing it between thumb and finger and gently rolling it.</li><li>Curl tails, horns and petals around a pencil or a bone folder.</li><li>Pull wings or legs apart slightly so the model balances.</li><li>Adjust head and tail angles with a small reverse fold if the diagram leaves them free.</li><li>Use tweezers for tiny tucks, and glue only when a model will not hold itself.</li></ul>`,
      },
    ],
    practice: [
      { model: 'Koi', grade: 'Challenging Easy', time: '5–10 min', trains: 'Fish shaping', url: om('koi') },
      { model: 'Dragon', grade: 'Challenging Easy', time: '10–15 min', trains: 'Long body, crimps', url: om('dragon') },
      { model: 'Giraffe', grade: 'Challenging Easy', time: '10 min', trains: 'Long neck', url: om('giraffe') },
      { model: 'Mouse', grade: 'Challenging Easy', time: '10–15 min', trains: 'Small animal', url: om('mouse') },
      { model: 'Hedgehog', grade: 'Challenging Easy', time: '10–15 min', trains: 'Texture pleats', url: om('hedgehog') },
      { model: 'Phoenix', grade: 'Challenging Easy', time: '10–15 min', trains: 'Bird with long tail', url: om('phoenix') },
      { model: 'Heart With Wings', grade: 'Challenging Easy', time: '10–15 min', trains: 'Symmetric shaping', url: om('heart-with-wings') },
      { model: 'Snake', grade: 'Challenging Easy', time: '15 min', trains: 'Repeated crimps', url: om('snake') },
      { model: 'Cat', grade: 'Challenging Easy', time: '15 min', trains: 'Head and tail', url: om('cat') },
      { model: 'Snail', grade: 'Challenging Easy', time: '15 min', trains: 'Curling', url: om('snail') },
      { model: 'Lion', grade: 'Challenging Easy', time: '15 min', trains: 'Mane texture', url: om('lion') },
      { model: 'Frog (traditional)', grade: 'Challenging Easy', time: '15–20 min', trains: 'Frog base', url: om('traditional-frog') },
      { model: 'T-Rex', grade: 'Challenging Easy', time: '20 min', trains: 'Legs and posture', url: om('t-rex') },
      { model: 'Imoseyama Cranes', grade: 'Challenging Easy', time: '20 min', trains: 'Two cranes, one sheet', url: om('imoseyama-cranes') },
      { model: 'Maple Leaf', grade: 'Challenging Easy', time: '20 min', trains: 'Points and symmetry', url: om('maple-leaf') },
      { model: 'Snowflake', grade: 'Challenging Easy', time: '20 min', trains: 'Six-fold symmetry', url: om('snowflake') },
      { model: 'Skull', grade: 'Challenging Easy', time: '10 min', trains: 'Face shaping', url: om('skull') },
    ],
    practice2: {
      title: 'First Low-Intermediate models (15 minutes or less)',
      note: 'For folders comfortable with the basic folds. Each is credited to a designer — learning to recognise designers’ styles is part of becoming a folder.',
      rows: [
        { model: 'Chameleon', designer: 'Adriano Mariani', grade: 'Low-Intermediate', time: '10–15 min', trains: '', url: om('chameleon') },
        { model: 'Camel', designer: 'Sébastien Limet', grade: 'Low-Intermediate', time: '10–15 min', trains: '', url: om('camel') },
        { model: 'Ghost', designer: 'Hiroaki Kobayashi', grade: 'Low-Intermediate', time: '15 min', trains: '', url: om('ghost') },
        { model: 'Ditto', designer: 'Ryan Dong', grade: 'Low-Intermediate', time: '15 min', trains: '', url: om('ditto') },
        { model: 'Manta Ray', designer: 'Nick Robinson', grade: 'Low-Intermediate', time: '15 min', trains: '', url: om('manta-ray') },
        { model: 'Leviathan', designer: 'Caleb Witte', grade: 'Low-Intermediate', time: '15 min', trains: '', url: om('leviathan') },
        { model: 'Shark', designer: 'Nick Robinson', grade: 'Low-Intermediate', time: '15–20 min', trains: '', url: om('shark') },
      ],
    },
    check: [
      'Fold two Challenging Easy animals with no hesitation at any step.',
      'Fold one Low-Intermediate model using only the diagram.',
      'Identify, on a finished model, where each reverse fold, crimp and pleat was used.',
      'Shape your finished model so that it stands or balances unaided.',
    ],
  },
  {
    n: 6,
    name: 'Advanced Technique',
    grade: 'Low-Intermediate to Intermediate',
    goal: 'Fold 20–30 minute models from a diagram, execute a sink fold and the frog base, choose paper to suit a model, and try wet folding and tessellation.',
    skills: 'Open sink, frog base, long-sequence discipline, paper selection, wet folding, pleat-based tessellation.',
    capstone: 'Advanced Skull, Dragon v2',
    hero: 'squash-fold',
    sections: [
      {
        title: 'The sink fold',
        html: `<p>A sink pushes a point or edge inside the model, so that a corner becomes a recess. It shortens a point, squares off a top, or hides a raw edge. Beginner models never need it.</p>
        <ol class="passes"><li><b>Pre-crease the outline.</b> Fold and unfold the line that cuts off the point, through all layers, firmly in both directions.</li><li><b>Open the model slightly</b> so the paper can bend, and reverse the creases around the area: valleys become mountains and mountains valleys.</li><li><b>Push the tip down and inward.</b> The paper collapses along the new creases and the area drops below the surface.</li><li><b>Flatten.</b> The sunk area is now enclosed by the surrounding layers.</li></ol>
        <p>In an <i>open sink</i> you open the model and push the tip through the open layers; a <i>closed sink</i> keeps the layers locked and needs sharper creases. Practise the open sink on the top of a <a href="#/fold/preliminary-base">preliminary base</a>. If the tip will not go down, a pre-crease is not sharp enough or one surrounding crease was not reversed.</p>`,
      },
      {
        title: 'The frog base',
        html: `<p>The frog base has four long points and four shorter ones, and is the most complicated traditional base (53 steps in full). Fold a preliminary base; <a href="#/fold/squash-fold">squash-fold</a> each of its four flaps into a diamond; then on each diamond fold the lower edges of the top layer to the centre, fold the top point down over them, unfold, and <a href="#/fold/bird-base">petal-fold</a>. All four petals should end the same length. Fold the traditional <a href="${om('traditional-frog')}" target="_blank" rel="noopener" class="ext">frog</a> next as a bridge to the advanced models.</p>`,
      },
      {
        title: 'Wet folding',
        html: `<p>Lightly dampened paper becomes pliable and dries stiff, giving soft curves instead of sharp edges. Tant, elephant hide and lizard hide suit it; thin kami does not.</p>
        <ol class="passes"><li>Choose a strong, thick paper.</li><li>Make the structural folds first, in the usual way.</li><li>Dampen the paper evenly with a barely wet sponge or brush; let surface water soak in.</li><li>Shape the curves by hand, supporting the model so it does not collapse.</li><li>Let it dry completely in the shape you want.</li></ol>
        <p>Try it first on the traditional <a href="${om('fish')}" target="_blank" rel="noopener" class="ext">fish</a>, not on something that took an hour.</p>`,
      },
      {
        title: 'Tessellation basics',
        html: `<p>A tessellation is a flat sheet folded into a repeating pattern of twists or pleat grids, often shown against light. Start with a pleat grid: fold a square into equal strips both ways, then alternate mountain and valley folds so the grid collapses into a rippled sheet. Glassine lets light through.</p>`,
      },
      {
        title: 'Working like an advanced folder',
        html: `<ul class="ticks"><li>Use larger paper, 20–30 cm, for detailed models.</li><li>Test-fold with kraft or printer paper to find the problem steps first.</li><li>Mark reference points lightly in pencil on the white side if a diagram gives no landmark.</li><li>Read the whole diagram once before folding.</li><li>Check the flap and layer count at every checkpoint.</li><li>Take breaks. Rushing causes most late-stage mistakes.</li></ul>`,
      },
    ],
    practice: [
      { model: 'Squid', designer: 'Caleb Witte', grade: 'Low-Intermediate', time: '20 min', trains: '', url: om('squid') },
      { model: 'Turkey', designer: 'Caleb Witte', grade: 'Low-Intermediate', time: '20 min', trains: '', url: om('turkey') },
      { model: 'Hexagonal Box', designer: 'Nick Robinson', grade: 'Low-Intermediate', time: '20 min', trains: '', url: om('hexagonal-box') },
      { model: 'Vase', designer: 'Traditional', grade: 'Low-Intermediate', time: '20 min', trains: '', url: om('vase') },
      { model: 'Rhinoceros', designer: 'Caleb Witte', grade: 'Low-Intermediate', time: '20–30 min', trains: '', url: om('rhinoceros') },
      { model: 'Tiger', designer: 'Sébastien Limet', grade: 'Low-Intermediate', time: '20–30 min', trains: '', url: om('tiger') },
      { model: 'Lucky Cat', designer: 'Oriol Esteve', grade: 'Low-Intermediate', time: '20–30 min', trains: '', url: om('lucky-cat') },
      { model: 'Spider', designer: 'Battistina Genta', grade: 'Low-Intermediate', time: '20–30 min', trains: '', url: om('spider') },
      { model: 'Advanced Skull', designer: 'Sébastien Limet', grade: 'Low-Intermediate', time: '30 min', trains: '', url: om('skull-advanced') },
      { model: 'Dragon v2', designer: 'Sébastien Limet', grade: 'Low-Intermediate', time: '30 min', trains: '', url: om('dragon-advanced') },
      { model: 'Vertigo', designer: 'Not listed', grade: 'Challenging Easy', time: '1 h 30 – 1 h 45', trains: '', url: om('vertigo') },
    ],
    practiceNote: 'Read each diagram first, then watch the video for the steps you cannot picture. Vertigo is graded Challenging Easy but takes far longer than the rest.',
    check: [
      'Execute a clean open sink on a preliminary base, the sunk area flat and enclosed.',
      'Fold the frog base with four equal petals.',
      'Complete one 30-minute model in a single sitting.',
      'Explain why you chose the paper you used, and what you would change next time.',
    ],
  },
  {
    n: 7,
    name: 'Mastery',
    grade: 'Beyond the free grades',
    goal: 'Read a crease pattern, understand why folds work, design and diagram an original model, and become part of the wider folding community.',
    skills: 'Reading crease patterns, the laws of flat folding, planning a model’s structure, drawing diagrams, studying other folders’ work.',
    capstone: 'Your own design',
    hero: 'bird-base',
    sections: [
      {
        title: 'Crease patterns',
        html: `<p>A crease pattern (CP) is the sheet unfolded with every crease drawn on it, mountains and valleys in different styles. A CP shows structure that a step diagram hides: where each flap comes from and how much paper it uses. To learn to read one:</p>
        <ol class="passes"><li>Fold a model you know, such as the crane.</li><li>Unfold it completely and flatten the sheet.</li><li>Trace every crease on a photocopy, marking mountains and valleys.</li><li>Find the grid, the diagonals and the repeating shapes: the preliminary base, the petal-fold creases, the reverse-fold creases.</li><li>Fold the model again from your own CP, without the diagram.</li></ol>
        <div data-cp="crane"></div>`,
      },
      {
        title: 'Two laws of flat folding',
        html: `<p>Around any interior vertex of a flat-foldable crease pattern:</p>
        <ul class="ticks"><li><b>Maekawa’s theorem.</b> The number of mountain folds and the number of valley folds differ by exactly two.</li><li><b>Kawasaki’s theorem.</b> The angles between creases alternately add up to 180°: angles 1, 3, 5… sum to 180, and so do 2, 4, 6…</li></ul>
        <p>Every animation on this site obeys both — the simulator only ever reflects flat pieces across crease lines. Use them to debug a design: if a vertex breaks either rule, it will not fold flat.</p>`,
      },
      {
        title: 'Designing your own model',
        html: `<ol class="passes"><li><b>Modify.</b> Start from a known base and change one thing: lengthen a flap with a crimp, change a head with a different reverse fold, add pleats.</li><li><b>Combine.</b> Join two ideas, such as the waterbomb and fish bases, and see what shapes appear.</li><li><b>List the features.</b> For an animal, count its appendages; each needs a flap whose length matches the real animal.</li><li><b>Plan the flaps.</b> Choose a base or grid that gives enough flaps of enough length.</li><li><b>Fold and refine.</b> Fold a draft from scrap, mark what fails, adjust, fold again.</li><li><b>Diagram it.</b> Write the sequence in standard symbols and test it on a friend.</li></ol>
        <p>Modern design goes far beyond the traditional bases: Akira Yoshizawa developed the notation; Robert J. Lang’s <i>Origami Design Secrets</i> teaches design systematically; Satoshi Kamiya, Eric Joisel, John Montroll, Tomoko Fuse and Giang Dinh are among the most influential folders.</p>`,
      },
      {
        title: 'Study plan: books by stage',
        html: `<div class="table-wrap"><table><thead><tr><th>Stage</th><th>Book</th><th>Author</th></tr></thead><tbody>
        ${[
          ['Beginner', 'Everyone Can Learn Origami', 'Peter Saydak'],
          ['Beginner', 'Easy Origami', 'John Montroll'],
          ['Beginner', 'Absolute Beginner’s Origami', 'Nick Robinson'],
          ['Beginner', 'World’s Best Origami', 'Nick Robinson'],
          ['Beginner', 'Easy Origami', 'Didier Boursin'],
          ['Intermediate', 'Origami for the Connoisseur', 'Kunihiko Kasahara and Toshie Takahama'],
          ['Intermediate', 'Origami Omnibus', 'Kunihiko Kasahara'],
          ['Intermediate', 'Origami Zoo', 'Robert J. Lang and Stephen Weiss'],
          ['Intermediate', 'The Complete Book of Origami', 'Robert J. Lang'],
          ['Intermediate', 'Origami Insects and Their Kin', 'Robert J. Lang'],
          ['Intermediate', 'Animal Origami for the Enthusiast', 'John Montroll'],
          ['Intermediate', 'Dinosaur Origami', 'John Montroll'],
          ['Intermediate', 'Crease and Fold', 'Sok Song'],
          ['Intermediate', 'Origami from Angelfish to Zen', 'Peter Engel'],
          ['Intermediate', 'Marvelous Modular Origami', 'Meenakshi Mukerji'],
          ['Advanced', 'Origami Design Secrets (2nd ed.)', 'Robert J. Lang'],
          ['Advanced', 'Works of Satoshi Kamiya 1995–2003 and 2, 2002–2009', 'Satoshi Kamiya'],
          ['Advanced', 'Origami Insects II', 'Robert J. Lang'],
          ['Advanced', 'Mind Blowing Modular Origami', 'Byriah Loper'],
        ]
          .map((r) => `<tr><td>${r[0]}</td><td><i>${r[1]}</i></td><td>${r[2]}</td></tr>`)
          .join('')}
        </tbody></table></div>
        <p>Also: the Passion Origami collection (Nicolas Terry, Roman Diaz, Quentin Trollip, Bernie Peyton and the Vietnam Origami Group) and the Tanteidan Convention books from the Japanese Origami Academic Society. Fold one model from each author to learn their style; compare the same animal by two designers; when a model fails, find the step where your paper first diverged from the picture.</p>`,
      },
      {
        title: 'Joining the community',
        html: `<ul class="ticks"><li>Follow the folders on origami.me’s <a href="${om('artists')}" target="_blank" rel="noopener" class="ext">artists page</a> and its galleries.</li><li>Join a local club or a national group such as OrigamiUSA or the British Origami Society, and attend a convention when you can.</li><li>Share photos, diagrams and crease patterns, and credit the designer of any model you fold.</li><li>Teach: a short class for beginners is the fastest test of your understanding.</li><li>Respect designers’ rights: check licensing terms before sharing or reselling any model or diagram.</li></ul>`,
      },
      {
        title: 'Capstone projects (pick at least two)',
        html: `<ol class="passes"><li><b>Unfold and rebuild.</b> Take a Level 5 or 6 model, unfold it, draw its CP, refold it from the CP alone.</li><li><b>Design a variant.</b> A new animal from the bird or frog base, with a diagram a stranger can follow.</li><li><b>A hundred cranes.</b> Fold 100 cranes of one size and string them — rhythm and consistency, and the 1797 <i>Senbazuru</i> tradition.</li><li><b>A Sonobe polyhedron.</b> The 30-unit stellated icosahedron.</li><li><b>Teach a class.</b> A 45-minute beginners’ session using Level 1 and 2 models, with a handout.</li></ol>`,
      },
    ],
    practice: [],
    check: [
      'Draw the crease pattern of a model by unfolding it, and verify both flat-folding laws at one vertex.',
      'Present one original or modified model with a clear diagram.',
      'Name five designers and describe one stylistic difference between two of them.',
      'Be able to say what you want to fold next, and why.',
    ],
  },
];

export const PAPER = [
  ['Kami', '60–63', 'Beginners and most models here; usually 15 × 15 cm', 'Warps in humid air'],
  ['Tant', '70–80', 'All levels, wet folding', 'Tears easily'],
  ['Kraft', 'about 30', 'Practice and test folds', 'Yellows; creases are hard to reverse'],
  ['Washi, chiyogami, yuzen', 'thick', 'Decorative traditional designs', 'Harder to crease sharply; pricier'],
  ['Foil', 'about 50', 'Metallic look; models that must hold their shape', 'Creases are permanent'],
  ['Glassine', 'about 40', 'Tessellations and light-through effects', 'Few colours; hard to undo folds'],
];

export const PAPER_ADV = [
  ['Tissue foil', 'about 50', 'Complex and 3D models; strong and easy to fold', 'Only nine colours'],
  ['Origamido', '20–50', 'Very complex models; handmade, about 40 × 50 cm', 'Exclusive and expensive'],
  ['Lokta', 'about 50 (25 super thin)', 'Animal models; silky texture', 'Expensive'],
  ['Unryu', 'about 27', 'Super-complex models', 'Needs treatment first; at least 40 × 40 cm'],
  ['Elephant hide', '110 or 190', 'Wet folding, organic curved models', 'Hard for children; not for very complex folds'],
  ['Lizard hide', '96–116', 'Lizards, dinosaurs; embossed texture', 'Tears easily'],
  ['Rhinoceros hide, kinumomi', 'about 107', 'Rhinos; textured', 'Behaves differently with and against the grain'],
];

/** Fold vocabulary; `demo` points at the tutorial step that shows it. */
export const FOLDS: { name: string; does: string; level: number; demo?: { id: string; step: number } }[] = [
  { name: 'Valley fold', does: 'The crease bends toward you, forming a trough.', level: 1, demo: { id: 'warmup', step: 5 } },
  { name: 'Mountain fold', does: 'The crease bends away from you, forming a ridge.', level: 1, demo: { id: 'cup', step: 6 } },
  { name: 'Pleat', does: 'A valley and a mountain side by side — a Z seen from the edge.', level: 1, demo: { id: 'warmup', step: 6 } },
  { name: 'Rabbit ear', does: 'Two bisector folds made at once; a triangular flap stands up and lies to one side.', level: 2, demo: { id: 'rabbit-ear', step: 4 } },
  { name: 'Squash fold', does: 'Open a flap and flatten it symmetrically into a diamond or triangle.', level: 2, demo: { id: 'squash-fold', step: 2 } },
  { name: 'Inside reverse fold', does: 'Push a point inside the model, between its own layers, along a crease.', level: 3, demo: { id: 'reverse-folds', step: 4 } },
  { name: 'Outside reverse fold', does: 'Wrap a point around the outside of the model.', level: 3, demo: { id: 'reverse-folds', step: 5 } },
  { name: 'Petal fold', does: 'Lift a flap while its sides fold in, forming a long narrow point; half of the bird base.', level: 3, demo: { id: 'bird-base', step: 5 } },
  { name: 'Crimp', does: 'A pair of reverse folds that steps a flap sideways.', level: 5, demo: { id: 'crimp-pleat', step: 5 } },
  { name: 'Swivel fold', does: 'A flap swings around a crease that forms as the paper moves.', level: 5 },
  { name: 'Open sink', does: 'The top of the model is pushed inside itself; the hardest fold in the basics.', level: 6 },
];

export const SYMBOLS: { name: string; meaning: string; svg: string }[] = [
  { name: 'Valley fold', meaning: 'Fold the paper toward you so the crease sinks.', svg: '<path d="M6 30H74" stroke="var(--accent)" stroke-width="2.2" stroke-dasharray="7 5"/>' },
  { name: 'Mountain fold', meaning: 'Fold the paper away from you so the crease points up.', svg: '<path d="M6 30H74" stroke="var(--accent)" stroke-width="2.2" stroke-dasharray="9 4 1.6 4 1.6 4"/>' },
  { name: 'Existing crease', meaning: 'Use it as a guide; do not fold again unless told.', svg: '<path d="M6 30H74" stroke="var(--ink-3)" stroke-width="1.2"/>' },
  { name: 'Fold arrow', meaning: 'Bring the paper to where the arrow ends.', svg: '<path d="M10 44Q40 2 70 40" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M70 40l-11-2 6-8z" fill="var(--ink)"/>' },
  { name: 'Fold behind', meaning: 'Mountain-fold: the arrow head is half and hollow.', svg: '<path d="M10 44Q40 2 70 40" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M70 40l-11-2 2.5-4z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>' },
  { name: 'Fold and unfold', meaning: 'Make a reference crease: fold, press, open again.', svg: '<path d="M10 44Q40 2 70 40" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M70 40l-11-2 6-8z" fill="var(--ink)"/><path d="M10 44l3-11 7 7z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>' },
  { name: 'Push / squash / sink', meaning: 'Press here: open and flatten, or push inside.', svg: '<path d="M62 30 46 18v7H16v10h30v7z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>' },
  { name: 'Turn over', meaning: 'Flip the model sideways, like turning a page.', svg: '<path d="M22 34a18 8 0 1 0 8-12" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M33 19l-2 9-7-6z" fill="var(--ink)"/>' },
  { name: 'Rotate', meaning: 'Turn the model flat on the table by the angle shown.', svg: '<path d="M40 14a16 16 0 1 1-15 6" fill="none" stroke="var(--ink)" stroke-width="2"/><path d="M22 13l2 10 7-6z" fill="var(--ink)"/>' },
  { name: 'Cut', meaning: 'Cut along the line (rare — only to make a square here).', svg: '<path d="M22 30H74" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 4"/><circle cx="12" cy="24" r="4" fill="none" stroke="var(--ink)" stroke-width="1.6"/><circle cx="12" cy="36" r="4" fill="none" stroke="var(--ink)" stroke-width="1.6"/><path d="M15 26l10 5M15 34l10-5" stroke="var(--ink)" stroke-width="1.6"/>' },
];

export const GLOSSARY = [
  ['Base', 'A standard folded starting shape, such as the kite, preliminary, waterbomb, fish, bird or frog base'],
  ['Crease', 'A line of fold left in the paper'],
  ['Crease pattern (CP)', 'The unfolded sheet with every crease drawn on it'],
  ['Flap', 'A free section of paper, such as a wing or leg'],
  ['GSM', 'Grams per square metre; a measure of paper weight'],
  ['Kami', 'Inexpensive, lightweight origami paper, usually 15 × 15 cm'],
  ['Kusudama', 'A ball or star built from many identical folded units'],
  ['Layer', 'One thickness of paper in a folded model'],
  ['Modular origami', 'A model assembled from several identical folded units'],
  ['Mountain fold', 'A fold whose crease points toward you while the paper bends away'],
  ['Valley fold', 'A fold whose crease points away from you while the paper bends toward you'],
  ['Orizuru', 'The Japanese word for a folded crane'],
  ['Pocket', 'An opening between layers that a flap can be tucked into'],
  ['Reference crease', 'A fold made only to mark a position, then unfolded'],
  ['Sink fold', 'A fold that pushes a point or edge inside the model'],
  ['Tessellation', 'A repeating folded pattern across a flat sheet'],
  ['Unit or module', 'One identical piece of a modular model'],
  ['Washi', 'Traditional handmade Japanese paper'],
  ['Wet folding', 'Folding with dampened paper to create rounded shapes'],
];

export const TROUBLE = [
  ['Corners do not meet', 'Early creases were imprecise', 'Restart; match corners first, then press the crease from the centre out'],
  ['Paper tears at a fold', 'Paper too thin, or a crease reversed too often', 'Use sturdier paper such as tant; avoid refolding the same crease'],
  ['A flap keeps popping open', 'Creases are not sharp', 'Re-crease with a bone folder; a dab of glue works for a keepsake'],
  ['The model is too thick to fold', 'Paper too heavy or too small', 'Use thinner paper or a larger sheet'],
  ['The model looks lopsided', 'The two sides were folded differently', 'Fold layers together where the diagram allows; compare sides at each step'],
  ['The model will not inflate', 'Paper too thick, or a flap is not tucked', 'Check the tucks, pinch the top while blowing, or use thinner paper'],
  ['A collapse twists', 'Pre-creases are too weak', 'Unfold and re-crease in both directions'],
  ['You are lost in a long diagram', 'A step was misread', 'Return to the last good step, count flaps and layers, replay the animation'],
  ['The frog does not jump', 'Paper too small or too thin', 'Use 15 × 15 cm kami'],
];

export const GRADES = [
  ['Very Easy', 'under 1 to 15 min', 'A handful of folds, no complicated bases', 'Fortune teller, boat, cup, swan, water bomb'],
  ['Easy', '5 to 20 min', 'More steps, one or two bases, some tucks', 'Crane, box, jumping frog, tulip, lily'],
  ['Challenging Easy', '5 to 20 min (some longer)', 'Many steps and careful shaping', 'Dragon, cat, giraffe, T-Rex'],
  ['Low-Intermediate', '10 to 30 min', 'Experience with basic folds assumed; more detail', 'Shark, tiger, lucky cat, dragon v2'],
];

export const PLAN = [
  [1, 'Level 0 and first folds', 'Square from A4/Letter; cup; boat', ['square-from-rect', 'cup', 'boat']],
  [2, 'Level 1', 'Fortune teller; five practice models', ['fortune-teller']],
  [3, 'Level 2 bases', 'Kite, preliminary and waterbomb bases; heart', ['kite-base', 'preliminary-base', 'waterbomb-base', 'heart']],
  [4, 'Level 2 models', 'Waterbomb balloon; dog; rose', ['balloon']],
  [5, 'Level 3', 'Bird base; crane', ['bird-base', 'crane']],
  [6, 'Level 3', 'Masu box and lid; jumping frog; tulip', ['masu-box']],
  [7, 'Level 4', 'Six Sonobe units; cube', ['sonobe']],
  [8, 'Level 4', 'Lily; one star or flower from the list', []],
  [9, 'Level 5', 'Dragon or cat in three passes', ['crimp-pleat']],
  [10, 'Level 5', 'Two Challenging Easy animals; one Low-Intermediate model', []],
  [11, 'Level 6', 'Sink-fold drill; frog base; a 20-minute model', ['squash-fold']],
  [12, 'Review', 'Redo your favourite model from each level; choose a Level 7 project', []],
] as const;

export const HISTORY = [
  ['Around the 2nd century BCE', 'Paper is invented in China and later reaches Japan via Korea, where it becomes washi.'],
  ['Muromachi period (1336–1573)', 'Noble clans develop ceremonial folding styles called girei-ori.'],
  ['Edo period (1603–1867)', 'Paper becomes affordable and folding spreads among ordinary people.'],
  ['1797', '<i>Hiden Senbazuru Orikata</i> — “Secret Folding Methods of a Thousand Cranes” — the oldest known origami book.'],
  ['Meiji period (1868–1912)', 'Folding enters schools to teach patience, balance and precision.'],
  ['20th century', 'Akira Yoshizawa (born 1911) develops the modern notation and becomes known as the father of modern origami; Samuel Randlett and Robert Harbin refine it into the Yoshizawa–Randlett system; Lillian Oppenheimer builds the Origami Center in New York.'],
  ['Today', 'Origami is the shared international name; the art includes life-like animals, modular and mathematical designs, and applications in fashion, architecture and science.'],
];

export const SOURCES = [
  ['origami.me home', 'https://origami.me/'],
  ['Origami Basics', 'https://origami.me/beginners-guide/'],
  ['Paper Guide', 'https://origami.me/paper/'],
  ['Free Beginner Course', 'https://origami.me/origami-course/'],
  ['Rectangle to Square', 'https://origami.me/rectangle-paper-to-square/'],
  ['Categories', 'https://origami.me/categories/'],
  ['Easy Origami index', 'https://origami.me/easy-origami/'],
  ['Intermediate Origami index', 'https://origami.me/intermediate-origami/'],
  ['History of Origami', 'https://origami.me/history-of-origami/'],
  ['Origami Books', 'https://origami.me/books/'],
  ['Sonobe unit cross-check (Riverbend Community Math Center)', 'https://riverbendmath.org/modules/Origami/Sonobe_Polyhedra/'],
];
