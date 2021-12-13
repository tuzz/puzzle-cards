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
        new card as the result. This is a bit like 'crafting' in video games, like
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
        'Worship the Sun', releasing in 2022. The puzzle shows a glimpse of the video
        game and has no bearing on recipes until the <A>Optional Endgame</A>.
      </p>
      <p>
        Every card has a tier (shown in the <strong>lower right</strong>). The
        aim of the game is to promote a card from Mortal to Master tier
        which is the highest available. This goal is achieved by applying a correct
        sequence of recipes.
      </p>
    </section>

    <section>
      <h2>Setting Up</h2>
      <p>
        The game runs on the Polygon network due to its vastly reduced
        environmental impact and tiny transaction fees (less than $0.001). Its
        native currency is <strong>MATIC</strong> so you'll need some to play
        the game:
      </p>
      <ol>
        <li>Open Chrome, Firefox or Edge</li>
        <li>Install the <a href="https://metamask.io/" target="_blank">MetaMask</a> browser extension and create a wallet</li>
        <li>Visit the <a href="/card-table" target="_blank">Card Table</a> and click on the MetaMask button</li>
        <li>Click 'Confirm' on the MetaMask popup to switch networks</li>
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
      <h2>Minting Cards</h2>
      <p>
        The first step in playing the game is to mint some cards. Place the Mint
        chip over the card outline (if it isn't already) and click on the MetaMask
        button. After confirming the transaction you will receive a random card.
      </p>
      <div className={styles.card_outline_example}>
        <div className={styles.mint_chip}>
          <img className={styles.chip} src={`/images/poker_chip_black.png`} />
          <div className={styles.mint}>Mint</div>
          <div className={styles.price}>$0.01</div>
        </div>

        <div className={styles.arrow1}>
          <span>Card Outline</span>
          <img src="/images/types/blue_arrow.png" />
        </div>

        <div className={styles.arrow2}>
          <span>Mint Chip</span>
          <img src="/images/types/blue_arrow.png" />
        </div>
      </div>
      <p>
        All actions in the game are performed by placing items over the card
        outline and pressing the MetaMask button. The <strong>Worship Stick</strong> will rise
        and a few seconds later, the transaction will be confirmed.
      </p>
      <p>
        The action that will be performed (if any) appears above the card outline.
        You can click on it to open the relevant section in this guide.
      </p>
      <p>
        To mint more than one card, click on the Mint chip to flip it over. You can
        select a different number the back as well as change the tier.
        If lots of cards are minted at once, only the first 10 will appear over the outline.
      </p>
    </section>

    <section>
      <h2>Card Types</h2>
      <p>TODO</p>
    </section>

    <section>
      <h2>Card Tiers</h2>
      <p>
        At the start of the game you can only mint cards at 'Mortal' tier. The
        aim of the game is to successfully promote a card to 'Master' tier.
      </p>
      <p>
        There are <strong>seven tiers</strong> in total. At each tier the game
        rules are modified slightly. You will usually face a new obstacle that you
        must overcome to progress to the tier above. These rule changes are explained below.
      </p>

      <h3>Mortal Tier</h3>
      <p>No changes. This is the base game.</p>

      <h3>Immortal Tier</h3>
      <p>Cards don't degrade. This is a good thing. See <a href="#card-conditions">Card Conditions</a>.</p>

      <h3>Ethereal Tier</h3>
      <p>
        Suns and moons are walled in making them inaccessible to Player and Crab cards.
        Fortunately, cloaks can pass through solid objects, like walls.
      </p>

      <h3>Virtual Tier</h3>
      <p>
        Instead of the usual probabilities, starter cards spawn as either Player, Glasses or Hidden cards with equal probability.
      </p>

      <h3>Celestial Tier</h3>
      <p>
        Helix cards always spawn with two matching colors (e.g. Red, Red).
      </p>

      <h3>Godly Tier</h3>
      <p>
        All of the above. Yikes!
      </p>

      <h3>Master Tier</h3>
      <p>
        All starter cards are Artwork cards. This is the <A>Optional Endgame</A>.
      </p>
    </section>

    <section>
      <h2>Optional Endgame (NFTs)</h2>
      <p>
        If you are successful in promoting a card all the way to Master tier
        you will unlock special recipes that allow you to create Limited Edition
        and Master Copy cards that can be traded on OpenSea as NFTs.
      </p>
      <p>
        This endgame is completely optional and is for people who want to own a
        significant piece of the video game itself: either a puzzle or its solution.
        These special recipes are <A>puzzleMastery1</A> and <A>puzzleMastery2</A>.
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
        Copy represents ownership of that puzzle from the video game which is an
        artefact of all the design, iterative development, playtesting and tuning
        that goes into the making of an enjoyable, memorable experience.
      </p>
      <p>
        Ownership of a Limited Edition card represents 1% ownership over the
        intended solution for the puzzle, the cleverness of it and the invisible
        dialogue between game designer and player. There are 100 available.
        Together, Limited Editions and Master Copies complement each other.
      </p>
    </section>
  </div>
);

export default HowToPlay;
