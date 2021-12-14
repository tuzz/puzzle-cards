import PuzzleCard from "../../public/PuzzleCard";
import ZoomableCard from "./zoomable_card";
import CardBack from "../CardBack";
import WoodSliders from "../WoodSliders";
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
      <h2 id="video">Watch the Video</h2>
      <p>TODO</p>
    </section>

    <section>
      <h2 id="overview">Brief Idea of the Game</h2>
      <p>
        The idea of the game is to combine cards according to 'recipes'. A
        recipe takes two or three cards as ingredients and produces a new card
        as the result. This is a bit like 'crafting' in video games, e.g. Minecraft.
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
        'Worship the Sun', releasing in 2022. It shows a preview of the video
        game and has no bearing on recipes until the <A>Optional Endgame</A>.
      </p>
      <p>
        Every card has a tier which is shown in the <strong>lower right</strong> corner. The
        aim of the game is to successfully promote a card from 'Mortal' tier to
        'Master' tier (the highest available) by applying a correct sequence of
        recipes.
      </p>
    </section>

    <section>
      <h2 id="setting-up">Setting Up</h2>
      <p>
        The game runs on the Polygon network due to its vastly reduced
        environmental impact and tiny transaction fees (less than $0.001). Its
        native currency is <strong>MATIC</strong> so you'll need some to play
        the game.
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
      <h2 id="mint">Minting Cards</h2>
      <p>
        The first step in playing the game is to mint some cards. Place the Mint
        chip over the card outline (if it isn't already) and click on the MetaMask
        button. After confirming the transaction you will receive a starter card.
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
        All actions in the game are performed by dragging objects over the card
        outline and pressing the MetaMask button. The <strong>Worship Stick</strong> will rise
        and a few seconds later, the transaction will be confirmed.
      </p>
      <p>
        The action that will be performed (if any) appears above the card outline.
        You can click on it to open the relevant section in this guide.
      </p>
      <p>
        To mint several cards at once, click on the Mint chip to flip it over. You can
        select a different number on the back. You can also change the <A id="card-tiers">tier</A>.
        If lots of cards are minted at once, only the first 10 will appear over the outline.
      </p>
    </section>

    <section>
      <h2 id="card-types">Card Types</h2>
      <p>
        There are 17 types of card. When a card is minted, or promoted to the next tier,
        you will receive a random 'starter' card for that tier. The probability of
        minting each type of card is shown below.
      </p>
      <div className={styles.spacer}>
        <div>
          <p>Player (<span className={styles.rarity1}>30%</span>)</p>
          <p>Inactive (<span className={styles.rarity1}>20%</span>)</p>
          <p>Crab (<span className={styles.rarity2}>10%</span>)</p>
          <p>Cloak (<span className={styles.rarity2}>10%</span>)</p>
          <p>Active (<span className={styles.rarity2}>10%</span>)</p>
          <p>Telescope (<span className={styles.rarity2}>10%</span>)</p>
          <p>Helix (<span className={styles.rarity3}>2%</span>)</p>
          <p>Beacon (<span className={styles.rarity3}>2%</span>)</p>
          <p>Torch (<span className={styles.rarity3}>2%</span>)</p>
        </div>
        <div>
          <p>Map (<span className={styles.rarity4}>1%</span>)</p>
          <p>Teleport (<span className={styles.rarity4}>1%</span>)</p>
          <p>Glasses (<span className={styles.rarity4}>1%</span>)</p>
          <p>Door (<span className={styles.rarity5}>0.6%</span>)</p>
          <p>Eclipse (<span className={styles.rarity5}>0.4%</span>)</p>
          <p>Hidden (<span className={styles.rarity6}>0%</span>)</p>
          <p>Star (<span className={styles.rarity6}>0%</span>)</p>
          <p>Artwork (<span className={styles.rarity6}>0%</span>)</p>
        </div>
      </div>
      <p>
        As you can see, Player cards are most common, closely followed by Inactive
        sun and moon cards. At the end of the list there are cards that cannot
        normally be obtained except at special <A id="card-tiers">tiers</A>.
      </p>
      <p>
        If you are fortunate enough to receive the more uncommon cards, you can
        skip ahead past a few recipes and reach the next tier sooner.
      </p>
    </section>

    <section>
      <h2 id="applying-recipes">Applying Recipes</h2>
      <p>
        To apply one of the <A>recipes</A>, drag the necessary cards over the
        card outline. The name of the recipe will appear above the outline.
        Press the MetaMask button and confirm the transaction to apply the recipe.
      </p>
      <p>
        Recipes only work on cards that have the <strong>same tier</strong> and the
        Mint chip must be removed from the card outline first. While a recipe is
        being applied, the cards will flip over you won't be able to move them.
      </p>
      <div className={styles.spacer}>
        <div className={styles.card_outline_example}>
          <div className={styles.text_above}><A>activateSunOrMoon</A></div>
          <div className={styles.back}><CardBack defects={{}} isMasterCopy={false} /></div>
          <div className={styles.front}><CardBack defects={{}} isMasterCopy={false} /></div>
        </div>
      </div>
      <p>
        If you own multiple copies of a card, you may be able to apply the same
        recipe several times. MetaMask will ask you to confirm or reject each
        transaction separately, allowing you choose how many times to apply it.
      </p>
      <p>
        It does not cost anything to apply recipes besides a tiny transaction
        fee seeing as the cards have already been paid for. If nothing seems to be
        happening, check you have confirmed all MetaMask popups.
      </p>
    </section>

    <section>
      <h2 id="wooden-sliders">Wooden Sliders</h2>
      <div className={styles.wood_sliders}>
        <WoodSliders alwaysShow={true} />
      </div>
      <p className={styles.obscured_when_narrow}>
        The wooden sliders on either side of the screen show up when you have
        at least seven cards in your deck. They serve two purposes:
      </p>
      <ol className={styles.obscured_when_narrow}>
        <li>They show the boundary of the 'working area'</li>
        <li>They allow you to clear the 'working area'</li>
      </ol>
      <div className={styles.wood_sliders_spacer}></div>
      <p>
        The working area is the region above the dashed lines. Any cards that
        overlap this area won't be cleared when searching your deck.
      </p>
      <p>
        For example, you might use the working area to make a pile of Glasses
        cards on the left and Hidden cards on the right. This will make it easier to
        apply the <A>lookThroughGlasses</A> recipe because these cards will be
        at hand.
      </p>
      <p>
        To clear the working area, press the hourglass button on one of the sliders.
        This will return all cards in this area to your deck. The wooden sliders
        cycle through different patterns, much like the 'Hands Gruber' puzzle:
      </p>
      <div className={styles.spacer}>
        <ZoomableCard subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Trial of Reign",
            puzzle: "Hands Gruber II",
            tier: "Mortal",
            type: "Active",
            color1: "Blue",
            color2: "None",
            variant: "Sun",
            condition: "Pristine",
            edition: "Standard",
        })} />
      </div>
    </section>

    <section>
      <h2 id="card-conditions">Card Conditions</h2>
      <p>
        Every card has a condition. When a card is minted its condition is either
        Pristine, Excellent or Reasonable with equal probability.
      </p>
      <p>
        When a recipe is applied, the condition of the resulting card will either
        be the same as the combined cards or it will degrade by one level. There
        is a 50/50 chance that it will degrade (until the lowest level is reached).
      </p>
      <p>
        Cards of a lower condition have more defects. For example, cards might
        be yellowed, contain fingerprints or coffee/ink stains. Their corners
        might be folded over or the foil might be peeling around the edges. In
        some cases, the puzzle might have slipped into a tilted position:
      </p>
      <div className={styles.spacer}>
        <ZoomableCard subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Teamwork",
            puzzle: "Pillar of Crabs",
            tier: "Mortal",
            type: "Cloak",
            color1: "Black",
            color2: "None",
            variant: "None",
            condition: "Dire",
            edition: "Standard",
        })} />
        <ZoomableCard subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Contending Claws",
            puzzle: "Island Hopping",
            tier: "Mortal",
            type: "Telescope",
            color1: "Red",
            color2: "None",
            variant: "Sun",
            condition: "Dire",
            edition: "Standard",
        })} />
      </div>
      <p>
        There are five conditions: Pristine, Excellent, Reasonable, Poor and Dire.
        Defects are selected randomly based on the severity of the condition.
      </p>
      <p>
        If cards with different conditions are used in a recipe, the lowest
        condition is used when deciding whether to randomly degrade or not. Once
        a card reaches the lowest condition (Dire) it will not degrade further.
      </p>
    </section>

    <section>
      <h2 id="card-tiers">Card Tiers</h2>
      <p>
        At the start of the game you can only mint cards at Mortal tier. The
        aim of the game is to successfully promote a card to Master tier. You
        unlock the ability to mint at the next tier when you successfully promote
        a card to it.
      </p>
      <p>
        There are <strong>seven tiers</strong> in total. At each tier, the game rules
        are modified slightly. You will usually face a new obstacle that you
        must overcome to progress to the tier above. These rule changes are
        summarized below.
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
        Instead of the <A id="card-types">usual probabilities</A>, starter cards
        spawn as either Player, Glasses or Hidden cards with equal probability.
      </p>

      <h3>Celestial Tier</h3>
      <p>
        Helix cards always spawn with two matching colors (e.g. Blue, Blue).
      </p>

      <h3>Godly Tier</h3>
      <p>
        All of the above. Yikes!
      </p>

      <h3>Master Tier</h3>
      <p>
        All starter cards are Artwork cards. This is the <A>Optional Endgame</A>.
      </p>

      <p style={{ marginTop: "4rem" }}>
        It is up to you to figure out how to adapt your play (if at all) to cope
        with these changes. It is helpful to familize yourself with the <A>Recipes</A>.
        A brief reminder of the tier's effects are shown at the bottom of each card:
      </p>
      <div className={styles.spacer}>
        <ZoomableCard subtitle="(click to zoom)" card={new PuzzleCard({
            series: "Two by Two",
            puzzle: "My Visiting Children",
            tier: "Godly",
            type: "Glasses",
            color1: "Black",
            color2: "Pink",
            variant: "None",
            condition: "Pristine",
            edition: "Standard",
        })} />
      </div>
    </section>

    <section>
      <h2 id="optional-endgame">Optional Endgame (NFTs)</h2>
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
        intended solution for the puzzle, its cleverness (or not) and the
        invisible dialogue between game designer and player. There are 100 available.
        Together, Limited Editions and Master Copies complement each other.
      </p>
    </section>

    <section>
      <h2 id="future-roadmap">Future Roadmap</h2>
      <p>TODO</p>
    </section>

    <section>
      <h2 id="technical-details">Technical Details</h2>
      <p>TODO: on-chain, contract locked down, non-upgradeable, i abide by the same rules</p>
      <p>can change the exchange rate, can add new puzzles/artwork</p>
      <p>link to contract, link to github, etc</p>
    </section>

    <section>
      <h2 id="personal-details">Personal Details</h2>
      <p>TODO: who made the game and why</p>
    </section>
  </div>
);

export default HowToPlay;
