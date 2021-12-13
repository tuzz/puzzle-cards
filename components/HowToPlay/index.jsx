import PuzzleCard from "../../public/PuzzleCard";
import ZoomableCard from "./zoomable_card";
import CardBack from "../CardBack";
import A from "./anchor";
import styles from "./styles.module.scss";

const HowToPlay = () => (
  <div className={styles.how_to_play}>
    <h1>How to Play</h1>

    <div className={styles.dividing_line}></div>

    <div className={styles.game_type}>
      <span>1 Player</span>
      <span>Ages 8 to adult</span>
    </div>

    <section>
      <h2>Brief Idea of the Game</h2>
      <p>
        The idea of the game is to combine cards according to 'recipes'. A
        recipe typically takes two or three cards as ingredients and produces a
        new card as the result. This is a bit like crafting in video games, e.g.
        Minecraft.
      </p>
      <p>
        Recipes are named after actions. For example, the <A>goThroughStarDoor</A> recipe
        takes a Player card and a Door card and produces a new card. The type of card
        (e.g. Player) is shown on the <strong>lower half</strong> of each card.
      </p>
      <div className={styles.spacer}>
        <ZoomableCard title="A Player Card" subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Teamwork",
            puzzle: "Sand Pit",
            tier: "Mortal",
            type: "Player",
            color1: "None",
            color2: "None",
            variant: "Idle Front",
            condition: "Pristine",
            edition: "Standard",
        })} />

        <ZoomableCard title="A Door Card" subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Star Gazing",
            puzzle: "Mysterious Aura",
            tier: "Mortal",
            type: "Door",
            color1: "None",
            color2: "None",
            variant: "Open",
            condition: "Pristine",
            edition: "Standard",
        })} />
      </div>
      <p>
        The <strong>upper half</strong> of each card features a puzzle from the upcoming game
        'Worship the Sun', releasing in 2022. This puzzle shows a glimpse of the video
        game and has no bearing on recipes until the <A>Optional Endgame</A>.
      </p>
      <p>
        Every card has a tier (shown in the <strong>lower right</strong>). The
        aim of the game is to promote a card to 'Master' tier which is the highest
        available. This goal is achieved by applying a correct sequence of recipes.
      </p>
    </section>

    <section>
      <h2>Setting Up</h2>
      <ol>
        <li>Open Chrome, Firefox or Edge</li>
        <li>Install the <a href="https://metamask.io/" target="_blank">MetaMask</a> browser extension and create a wallet</li>
        <li>Visit the <a href="/card-table" target="_blank">Card Table</a> and click on the MetaMask button in the middle</li>
        <li>Click 'Confirm' on the MetaMask popup to switch networks</li>
      </ol>
      <p>
        The game runs on the Polygon network due to its vastly reduced
        environmental impact and tiny transaction fees (less than $0.001). Its
        native currency is MATIC so you'll need some to play the game:
      </p>
      <ol>
        <li>Visit <a href="https://quickswap.exchange/" target="_blank">quickswap.exchange</a> and click 'Buy' at the top</li>
        <li>Select 'Transak' if you are in Europe or 'MoonPay' in the US</li>
        <li>Convert from your currency to MATIC (Polygon) via bank transfer</li>
      </ol>
      <p>
        I'd recommend exchanging just a few dollars, euros or pounds to get
        started so you can try the game and see if you like it. This is the
        simplest and cheapest way I've found to buy MATIC.
      </p>
    </section>

    <section>
      <h2>Optional Endgame (NFTs)</h2>
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
        design, development and testing that goes into making an enjoyable
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
    </section>
  </div>
);

export default HowToPlay;
