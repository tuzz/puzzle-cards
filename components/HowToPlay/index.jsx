import PuzzleCard from "../../public/PuzzleCard";
import ZoomableCard from "./zoomable_card";
import styles from "./styles.module.scss";

const HowToPlay = () => (
  <div className={styles.how_to_play}>
    <h1>How to play</h1>

    <div className={styles.dividing_line}></div>

    <div className={styles.game_type}>
      <span>1 Player</span>
      <span>Ages 8 to 177</span>
    </div>

    <h2>Brief idea of the game</h2>
    <div className={styles.centered}>
      <p>
        The idea of the game is to combine cards according to 'recipes' until
        you reach the highest tier available. Along the way, you will be faced
        with unique challenges that you must overcome to make progress.
      </p>
      <p>
        Recipes typically take two or three cards as ingredients and produce a
        new card as the result. This is a bit like crafting in video games, or
        baking a delicious cake where the output is better than the sum of its
        parts.
      </p>
      <p>
        All cards have a 'tier'. At the start of the game you can mint new cards
        at the 'Mortal' tier but all others are locked. To unlock the tier above
        you must promote a card to it by applying a correct sequence of recipes.
      </p>
      <p>
        Each tier introduces a different obstacle and you must adapt your play
        to overcome it. These obstacles modify the game rules in small ways.
      </p>
      <p>
        The game is won when you successfully promote a card to 'Master' tier,
        at which point, you will unlock original artwork and the optional endgame.
      </p>
    </div>

    <h2>Optional Endgame (NFTs)</h2>
    <div className={styles.centered}>
      <p>
        If you are successful in promoting a card all the way to 'Master' tier
        you will unlock special recipes that allow you to create Limited Edition
        and Master Copy cards that can be traded on OpenSea as NFTs.
      </p>
      <p>
        This endgame is completely optional and is for people who want to own a
        significant piece of the video game itself: either a puzzle or its solution.
      </p>
      <div className={styles.spacer}>
        <ZoomableCard title="Limited Edition" subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Mutual Exclusion",
            puzzle: "Crab Sticks",
            tier: "Master",
            type: "Artwork",
            color1: "None",
            color2: "None",
            variant: "Starfish",
            condition: "Pristine",
            edition: "Limited",
        })} />
        <ZoomableCard title="Master Copy" subtitle="(click to zoom)" card={new PuzzleCard({
            series: "The Beginning",
            puzzle: "What is this?",
            tier: "Master",
            type: "Artwork",
            color1: "None",
            color2: "None",
            variant: "Big Tree",
            condition: "Pristine",
            edition: "Master Copy",
        })} />
      </div>
      <p>
        Each card features a puzzle at the top of it. Ownership of the Master
        Copy represents ownership of that puzzle from the video game - all the
        design and iterative development that goes into making an enjoyable
        experience.
      </p>
      <p>
        Ownership of a Limited Edition card represents 1% ownership over the
        intended solution for the puzzle, or - if there are multiple solutions
        - the space of possible solutions for the puzzle. There are 100 available.
      </p>
      <p>
        Together, Limited Editions and Master Copies complement each other.
        They recognise the very real, visceral experience people have playing
        puzzle games; the invisible dialogue between designer and player.
      </p>
    </div>
  </div>
);

export default HowToPlay;
      //<p> The card game is based on the upcoming puzzle/platform game called 'Worship the Sun', releasing in 2022. Recipes are named after actions from the game, such as 'lookThroughTelescope' and 'jumpIntoEclipse'.  </p>
