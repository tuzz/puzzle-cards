import PuzzleCard from "../../public/PuzzleCard";
import ZoomableCard from "./zoomable_card";
import CardBack from "../CardBack";
import WoodSliders from "../WoodSliders";
import Toggle from "./toggle";
import styles from "./styles.module.scss";

const HowToPlay = () => (
  <div className={styles.how_to_play}>
    <h1 id="howToPlay">How to Play</h1>

    <div className={styles.dividing_line}></div>

    <div className={styles.game_type}>
      <span>1 Player</span>
      <span>Ages 8 to adult</span>
    </div>

    <section>
      <h2 id="watchTheVideo"><a href="#watchTheVideo">Watch the Video</a></h2>
      <p>TODO</p>
    </section>

    <section>
      <h2 id="briefIdeaOfTheGame"><a href="#briefIdeaOfTheGame">Brief Idea of the Game</a></h2>
      <p>
        The idea of the game is to combine cards according to 'recipes'. A
        recipe takes two or three cards as ingredients and produces a new card
        as the result. This is a bit like 'crafting' in video games, e.g. Minecraft.
      </p>
      <p>
        <a href="#recipes">Recipes</a> are named after actions. For example, the <a href="#goThroughStarDoor">goThroughStarDoor</a> recipe
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
        game and has no bearing on recipes until the <a href="#optionalEndgame">Optional Endgame</a>.
      </p>
      <p>
        Every card has a tier which is shown in the <strong>lower right</strong> corner. The
        aim of the game is to successfully promote a card from 'Mortal' tier to
        'Master' tier (the highest available) by applying a correct sequence of
        recipes.
      </p>
    </section>

    <section>
      <h2 id="settingUp"><a href="#settingUp">Setting Up</a></h2>
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
      <h2 id="mintingCards"><a href="#mintingCards">Minting Cards</a></h2>
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
        select a different number on the back. You can also change the <a href="#cardTiers">tier</a>.
        If lots of cards are minted at once, only the first 10 will appear over the outline.
      </p>
    </section>

    <section>
      <h2 id="cardTypes"><a href="#cardTypes">Card Types</a></h2>
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
        normally be obtained except at special <a href="#cardTiers">tiers</a>.
      </p>
      <p>
        If you are fortunate enough to receive the more uncommon cards, you can
        skip ahead past a few recipes and reach the next tier sooner.
      </p>
    </section>

    <section>
      <h2 id="applyingRecipes"><a href="#applyingRecipes">Applying Recipes</a></h2>
      <p>
        To apply one of the <a href="#recipes">recipes</a>, drag the necessary cards over the
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
          <div className={styles.text_above}><a href="#activateSunOrMoon">activateSunOrMoon</a></div>
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
      <p>
        The puzzle at the top of the card will be randomized each time a recipe
        is applied, except in the <a href="#optionalEndgame">Optional Endgame</a> when
        this can be controlled.
      </p>
    </section>

    <section>
      <h2 id="woodenSliders"><a href="#woodenSliders">Wooden Sliders</a></h2>
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
        apply the <a href="#lookThroughGlasses">lookThroughGlasses</a> recipe because these cards will be
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
      <h2 id="cardConditions"><a href="#cardConditions">Card Conditions</a></h2>
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
      <h2 id="cardTiers"><a href="#cardTiers">Card Tiers</a></h2>
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
      <p>Cards don't degrade. This is a good thing. See <a href="#cardConditions">Card Conditions</a>.</p>

      <h3>Ethereal Tier</h3>
      <p>
        Suns and moons are walled in making them inaccessible to Player and Crab cards.
        Fortunately, cloaks can pass through solid objects, like walls.
      </p>

      <h3>Virtual Tier</h3>
      <p>
        Instead of the <a href="#cardTypes">usual probabilities</a>, starter cards
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
        All starter cards are Artwork cards. This is the <a href="#optionalEndgame">Optional Endgame</a>.
      </p>

      <p style={{ marginTop: "4rem" }}>
        It is up to you to figure out how to adapt your play (if at all) to cope
        with these changes. It is helpful to familiarize yourself with the <a href="#recipes">Recipes</a>.
        An icon reminding you of the tier's effects are shown at the bottom of each card:
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
      <h2 id="optionalEndgame"><a href="#optionalEndgame">Optional Endgame (NFTs)</a></h2>
      <p>
        If you are successful in promoting a card all the way to Master tier
        you will unlock special recipes that allow you to create Limited Edition
        and Master Copy cards that can be traded on OpenSea as NFTs.
      </p>
      <p>
        This endgame is completely optional and is for people who want to own a
        significant piece of the video game itself: either a puzzle or its solution.
        These special recipes are <a href="#puzzleMastery1">puzzleMastery1</a> and <a href="#puzzleMastery2">puzzleMastery2</a>.
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
      <h2 id="futureRoadmap"><a href="#futureRoadmap">Future Roadmap</a></h2>
      <p>
        The highest priority item is to finish building the video game and release it to the public.
        Brand new puzzles and artwork will be added into the card game as they are developed.
        I estimate there will be around 300 puzzles.
      </p>
      <p>
        If there is enough interest in Puzzle Cards, I will add features, such as:
      </p>
      <ul>
        <li>A 'PuzzléDex' so that owners can exhibit their decks, hunt down cards they are missing and receive a numeric score for their deck</li>
        <li>A global leaderboard to compare your deck against others'</li>
        <li>A dashboard that shows which Master Copies and Limited Edition cards have been claimed and the players that claimed them</li>
        <li>Special cards that grant early access/free copies of the video game</li>
        <li>A mechanism that distributes tokens to owners of Limited Edition and Master Copy cards that can be redeemed in future projects</li>
      </ul>
      <p>
        If you have an idea for a feature you'd like to see please <a href="https://twitter.com/chrispatuzzo" target="_blank">let me know</a>.
      </p>
    </section>

    <section>
      <h2 id="technicalDetails"><a href="#technicalDetails">Technical Details</a></h2>
      <p>
        The game rules are enforced by
        the <a href={`${PuzzleCard.CONTRACT_NETWORK.explorer}/address/${PuzzleCard.CONTRACT_ADDRESS}`} target="_blank">Puzzle Card contract</a> which has been verified on Polygonscan.
        All card attributes are stored 'on chain' in the contract. All code is <a href="https://github.com/tuzz/puzzle-cards/" target="_blank">open on GitHub</a>, including this website.
      </p>

      <Toggle>
        <p>
          The contract is non-upgradeable except
          in very particular ways. I am
          able to add new puzzles/artwork and update the exchange rate. The number of
          limited editions <a href="https://github.com/tuzz/puzzle-cards/blob/main/contracts/PuzzleCard.sol#L716" target="_blank">cannot change</a> to prevent diluting their value (rug pulls).
        </p>
        <p>
          Additionally, I am unable to mint arbitrary cards and have no control
          over those that belong to people. They are truly yours. I abide by the same
          game rules as everyone else and have not pre-claimed any NFTs.
        </p>
        <p>
          The contract is <a href="https://github.com/tuzz/puzzle-cards/tree/main/test" target="_blank">extensively tested</a> with a suite that takes ~an hour to run.
          This includes a test that automatically plays the game using
          a <a href="https://github.com/tuzz/puzzle-cards/blob/main/test/Promotion.test.js#L118-L122" target="_blank">recursive</a> strategy.
          This test was used to balance the game and its <a href="#cardTiers">tier modifers</a>.
        </p>
        <p>
          This website is written in React and hosted on GitHub pages. There are
          8,631 card combinations per puzzle and 116 puzzles meaning there
          are 1,001,196 card combinations. This will increase as puzzles are added.
        </p>
        <p>
          All metadata and card images were precomputed over several days. This data
          resides in an S3 bucket so that it can be updated, e.g. to change
          the <a href="https://puzzlecards.s3.eu-west-1.amazonaws.com/metadata_api/0000000000000000000000000000000000000000000000000000000000000000.json" target="_blank">OpenSea description</a> or
          increase the resolution of <a href="https://puzzlecards.s3.eu-west-1.amazonaws.com/card_images/0.jpeg" target="_blank">the images</a>.
        </p>
        <p>
          All metadata and images can be regenerated from <a href="https://github.com/tuzz/puzzle-cards/tree/main/bin" target="_blank">scripts in the project</a> which is open on GitHub.
          High resolution videos are <a href="https://www.youtube.com/channel/UCGNBLgDrODwRMEuS9Zjh7Xw" target="_blank">stored on YouTube</a> so that the (smaller) puzzle videos can be recreated if necessary.
        </p>
        <p>
          Puzzle videos <a href="https://github.com/tuzz/puzzle-cards/blob/main/bin/transcode_puzzles" target="_blank">were transcoded</a> from raw 4K60 captures of real game footage.
          They are transcoded into AV1, VP9, HEVC and X264 to support a wide variety
          of browsers with low file sizes so that they load quickly.
        </p>
        <p>
          Cloak and Teleport cards make use of VP9 and HEVC's support for transparent
          video. This is quite new and has a few <a href="https://trac.ffmpeg.org/ticket/9531" target="_blank">rough edges</a> in Safari.
        </p>
        <p>
          When viewing cards on OpenSea, an iframe is embedded that links back to this site via
          the <a href="https://docs.opensea.io/docs/metadata-standards#metadata-structure" target="_blank">animation_url field</a> in the metadata.
        </p>
        <p>
         All of the contract and website code is fully auditable and open on GitHub.
         Puzzle Cards can be freely shared on social media, OpenSea, etc. Everything
         else is Copyright 2022, Chris Patuzzo, All Rights Reserved.
        </p>
        <p>
          If you wish to interact with the contract programmatically in your project,
          you may include <a href="https://puzzlecards.github.io/PuzzleCard.js" target="_blank">PuzzleCard.js</a> which
          provides lots of helper methods for working with the project, e.g. methods for fetching a user's deck.
        </p>
      </Toggle>
    </section>

    <section>
      <h2 id="personalDetails"><a href="#personalDetails">Personal Details</a></h2>
      <p>
        This game was designed and developed by <a href="https://twitter.com/chrispatuzzo" target="_blank">Chris Patuzzo</a> who lives in London.
        All proceeds go towards supporting Chris's work. This includes card sales from this website and a 5% commision on OpenSea sales.
      </p>
      <Toggle>
        <p>
          I have tried to keep prices low so that as many people as possible can enjoy the game while still making it financially viable for me.
          I am also hoping this will build interest in the video game when it releases in 2022.
        </p>
        <p>
          The recipes used in this card game are based on the video game. They are a simplified, rule-based version of its mechanics. From a computer science perspective,
          they form a <a href="https://en.wikipedia.org/wiki/Probabilistic_context-free_grammar" target="_blank">probabilistic context-free grammar</a>.
        </p>
        <p>
          I'm a much better programmer than I am an artist.
          I have tried my best to make the cards as appealing as possible.
          I didn't want to complicate them too much so that the card types are easier to understand.
        </p>
        <p>
          All of the artwork is hand drawn by me, except for textured elements which are either creative commons or licensed from sites such as iStock.
        </p>
        <p>
          I worked for approximately 75 days straight to build the card game. Needless to say I am looking forward to a break.
        </p>
      </Toggle>
    </section>

    <div className={styles.table_edge}></div>

    <div className={styles.recipes}>
      <h2 id="recipes"><a href="#recipes">Recipes</a></h2>

      <section className={styles.recipes_list_section}>
        <a className={styles.link_to_how_to_play} href="#howToPlay"><strong>^</strong> How to Play</a>
        <p>
          There are 12 recipes:
        </p>
        <div className={styles.spacer}>
          <ul>
            <li><a href="#activateSunOrMoon">activateSunOrMoon</a></li>
            <li><a href="#discard2Pickup1">discard2Pickup1</a></li>
            <li><a href="#lookThroughGlasses">lookThroughGlasses</a></li>
            <li><a href="#lookThroughTelescope">lookThroughTelescope</a></li>
            <li><a href="#shineTorchOnBasePair">shineTorchOnBasePair</a></li>
            <li><a href="#teleportToNextArea">teleportToNextArea</a></li>
          </ul>
          <ul>
            <li><a href="#changeLensColor">changeLensColor</a></li>
            <li><a href="#jumpIntoBeacon">jumpIntoBeacon</a></li>
            <li><a href="#jumpIntoEclipse">jumpIntoEclipse</a></li>
            <li><a href="#goThroughStarDoor">goThroughStarDoor</a></li>
            <li><a href="#puzzleMastery1">puzzleMastery1</a></li>
            <li><a href="#puzzleMastery2">puzzleMastery2</a></li>
          </ul>
        </div>
        <p>
          All cards must be the same tier when <a href="#applyingRecipes">applying a recipe</a>.
          The puzzles don't have to match to be used in a recipe, except in <a href="#puzzleMastery1">puzzleMastery1</a>.
          Puzzle videos are paused in the recipes below to avoid overloading your browser.
        </p>
      </section>

      <section>
        <h3 id="activateSunOrMoon"><a href="#activateSunOrMoon">activateSunOrMoon</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Activates a sun or moon by walking (or flying) into it.</em></p>
        <p>
          Takes either a <strong>Player</strong>, <strong>Crab</strong> or <strong>Cloak</strong> card
          and an <strong>Inactive</strong> sun or moon card
          and produces an <strong>Active</strong> card of the same kind.
        </p>
        <p>
          If a <strong>Cloak</strong> card is used, its color must match
          the <strong>Inactive</strong> card. Only a <strong>Cloak</strong> card
          will work at Ethereal and Godly <a href="#cardTiers">tiers</a>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1270}`}>
          <div className={`${styles.disjunction} ${styles.three_cards} ${styles.player_crab_cloak}`}>
            <ZoomableCard title="Player" className={`${styles.recipe_card} ${styles.player_card}`} autoPlay={false} card={new PuzzleCard({
                series: "Star Gazing",
                puzzle: "Asteroid Hopping",
                tier: "Mortal",
                type: "Player",
                color1: "None",
                color2: "None",
                variant: "Idle Front",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Crab" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Star Gazing",
                puzzle: "Asteroid Hopping",
                tier: "Mortal",
                type: "Crab",
                color1: "None",
                color2: "None",
                variant: "Standing",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Cloak" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Star Gazing",
                puzzle: "Asteroid Hopping",
                tier: "Mortal",
                type: "Cloak",
                color1: "Red",
                color2: "None",
                variant: "Standing",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>

          <span className={styles.plus}>+</span>
          <ZoomableCard title="Inactive" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Star Gazing",
              puzzle: "Asteroid Hopping",
              tier: "Mortal",
              type: "Inactive",
              color1: "Red",
              color2: "None",
              variant: "Sun",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Active" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Star Gazing",
              puzzle: "Asteroid Hopping",
              tier: "Mortal",
              type: "Active",
              color1: "Red",
              color2: "None",
              variant: "Sun",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>

        <img src="/images/asteroid1.png" className={styles.asteroid1} />
      </section>

      <section>
        <h3 id="discard2Pickup1"><a href="#discard2Pickup1">discard2Pickup1</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Sacrifice two cards to a sun god in exchange for a new one.</em></p>
        <p>
          Takes any two cards of the same tier and produces a random starter card, as though it was obtained by minting.
          This will usually follow the standard <a href="#cardTypes">type probabilities</a> except at Virtual, Godly and Master <a href="#cardTiers">tiers</a>.
        </p>
        <p>
          This counts as applying a recipe so cards may <a href="#cardConditions">degrade</a>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_850}`}>
          <ZoomableCard title="Any" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.any_card}`} autoPlay={false} card={new PuzzleCard({
              series: "The Beginning",
              puzzle: "God Rays",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Any" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.any_card}`} autoPlay={false} card={new PuzzleCard({
              series: "The Beginning",
              puzzle: "God Rays",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Random" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.starter_card}`} autoPlay={false} card={new PuzzleCard({
              series: "The Beginning",
              puzzle: "God Rays",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>
      </section>

      <section>
        <h3 id="lookThroughGlasses"><a href="#lookThroughGlasses">lookThroughGlasses</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Reveals a hidden card by looking through augmented reality sunglasses.</em></p>
        <p>
          Takes a <strong>Player</strong> card, a <strong>Glasses</strong> card and a <strong>Hidden</strong> card and
          produces a random starter card based on the <a href="#cardTypes">type probabilities</a> except that <strong>Player</strong> and <strong>Glasses</strong> cards
          won't spawn and <strong>Crab</strong> cards are much more unlikely.
        </p>
        <p>
          If the lens colors on the <strong>Glasses</strong> card are the same, you will receive one card.
          If they are different you will receive two cards.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1160}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Crab Construction",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
        <span className={styles.plus}>+</span>
          <ZoomableCard title="Glasses" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Crab Construction",
              tier: "Mortal",
              type: "Glasses",
              color1: "Green",
              color2: "Black",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Hidden" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Crab Construction",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Random" subtitle="1 or 2 cards" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.starter_card}`} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Crab Construction",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>

        <img src="/images/types/crab_standing.png" className={styles.spinning_crab} />
      </section>

      <section>
        <img src="/images/asteroid2.png" className={styles.asteroid2} />

        <h3 id="lookThroughTelescope"><a href="#lookThroughTelescope">lookThroughTelescope</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Reveals something useful in a faraway place.</em></p>
        <p>
          Takes a <strong>Player</strong> card, a <strong>Telescope</strong> card and an <strong>Active</strong> sun or moon card and
          produces either a <strong>Helix</strong>, <strong>Torch</strong> or <strong>Beacon</strong> card with equal probability.
          The <strong>Active</strong> sun or moon card must match the <strong>Telescope</strong>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1570}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Crab’s Day Out",
              puzzle: "Out to Sea",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
        <span className={styles.plus}>+</span>
          <ZoomableCard title="Telescope" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Crab’s Day Out",
              puzzle: "Out to Sea",
              tier: "Mortal",
              type: "Telescope",
              color1: "Blue",
              color2: "None",
              variant: "Moon",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Active" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Crab’s Day Out",
              puzzle: "Out to Sea",
              tier: "Mortal",
              type: "Active",
              color1: "Blue",
              color2: "None",
              variant: "Moon",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <div className={`${styles.disjunction} ${styles.three_cards} ${styles.helix_torch_beacon}`}>
            <ZoomableCard title="Helix" subtitle="33.3%" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Crab’s Day Out",
                puzzle: "Out to Sea",
                tier: "Mortal",
                type: "Helix",
                color1: "Red",
                color2: "Green",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Torch" subtitle="33.3%" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Crab’s Day Out",
                puzzle: "Out to Sea",
                tier: "Mortal",
                type: "Torch",
                color1: "Red",
                color2: "Green",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Beacon" subtitle="33.3%" className={`${styles.recipe_card} ${styles.beacon_card}`} autoPlay={false} card={new PuzzleCard({
                series: "Crab’s Day Out",
                puzzle: "Out to Sea",
                tier: "Mortal",
                type: "Beacon",
                color1: "Red",
                color2: "None",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>
        </div>
      </section>

      <section>
        <h3 id="shineTorchOnBasePair"><a href="#shineTorchOnBasePair">shineTorchOnBasePair</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Activates the photo sensors of a base pair in a strand of celestial DNA. The base pair opens to reveal the location of a secret object.</em></p>
        <p>
          Takes a <strong>Player</strong> card, a <strong>Torch</strong> card and a <strong>Helix</strong> card
          and produces either a <strong>Map</strong> or <strong>Teleport</strong> card with equal probability.
          The lens colors of the <strong>Torch</strong> must match the <strong>Helix</strong> colors and be in the same left-to-right order.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1350}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Trial of Rebirth",
              puzzle: "Base Pair",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Torch" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Trial of Rebirth",
              puzzle: "Base Pair",
              tier: "Mortal",
              type: "Torch",
              color1: "Red",
              color2: "Green",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Helix" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Trial of Rebirth",
              puzzle: "Base Pair",
              tier: "Mortal",
              type: "Helix",
              color1: "Red",
              color2: "Green",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <div className={styles.disjunction}>
            <ZoomableCard title="Map" subtitle="50%" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Trial of Rebirth",
                puzzle: "Base Pair",
                tier: "Mortal",
                type: "Map",
                color1: "None",
                color2: "None",
                variant: "With Time, Location",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Teleport" subtitle="50%" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Trial of Rebirth",
                puzzle: "Base Pair",
                tier: "Mortal",
                type: "Teleport",
                color1: "None",
                color2: "None",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>
        </div>

        <img src="/images/asteroid3.png" className={styles.asteroid3} />
      </section>

      <section>
        <h3 id="teleportToNextArea"><a href="#teleportToNextArea">teleportToNextArea</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>After checking the map, the player teleports to a new area.</em></p>
        <p>
          Takes a <strong>Player</strong>, <strong>Map</strong> and a <strong>Teleport</strong> card
          and <span className={styles.promotes}>promotes</span> to the tier above. Unlocks minting at the next tier and produces a random <a href="#cardTypes">starter card</a>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1140}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Darkness Yields Light",
              puzzle: "Buried in the Sand",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Map" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Darkness Yields Light",
              puzzle: "Buried in the Sand",
              tier: "Mortal",
              type: "Map",
              color1: "None",
              color2: "None",
              variant: "With Date",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Teleport" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Darkness Yields Light",
              puzzle: "Buried in the Sand",
              tier: "Mortal",
              type: "Teleport",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Random" subtitle="tier above" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.starter_card}`} autoPlay={false} card={new PuzzleCard({
              series: "Darkness Yields Light",
              puzzle: "Buried in the Sand",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>
      </section>

      <section>
        <h3 id="changeLensColor"><a href="#changeLensColor">changeLensColor</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Activates a sun or moon to re-augment an optical device.</em></p>
        <p>
          Takes either a <strong>Player</strong>, <strong>Crab</strong> or <strong>Cloak</strong> card, an <strong>Inactive</strong> card and an optical device that is either a <strong>Torch</strong> or <strong>Glasses</strong> card.
          Produces a card of the same (optical) type but with different lens colors.
        </p>
        <p>
          The lens colors will be swapped in one of them matches the <strong>Inactive</strong> card. Otherwise, a random lens will be changed to the <strong>Inactive</strong> card's color.
        </p>
        <p>
          If a <strong>Cloak</strong> card is used, its color must match the <strong>Inactive</strong> card. Only a <strong>Cloak</strong> card will work at Ethereal and Godly <a href="#cardTiers">tiers</a>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1980}`}>
          <div className={`${styles.disjunction} ${styles.three_cards} ${styles.player_crab_cloak}`}>
            <ZoomableCard title="Player" className={`${styles.recipe_card} ${styles.player_card}`} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Player",
                color1: "None",
                color2: "None",
                variant: "Idle Front",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Crab" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Crab",
                color1: "None",
                color2: "None",
                variant: "Standing",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Cloak" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Cloak",
                color1: "Red",
                color2: "None",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>

          <span className={styles.plus}>+</span>
          <ZoomableCard title="Inactive" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Escape",
              puzzle: "Locked In",
              tier: "Mortal",
              type: "Inactive",
              color1: "Red",
              color2: "None",
              variant: "Moon",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.plus}>+</span>
          <div className={styles.disjunction}>
            <ZoomableCard title="Torch" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Torch",
                color1: "Red",
                color2: "Green",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Glasses" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Glasses",
                color1: "Green",
                color2: "Black",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>

          <span className={styles.equals}>=</span>
          <div className={styles.disjunction}>
            <ZoomableCard title="Torch" subtitle="(e.g. swapped)" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Torch",
                color1: "Green",
                color2: "Red",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Glasses" subtitle="(e.g. changed)" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Escape",
                puzzle: "Locked In",
                tier: "Mortal",
                type: "Glasses",
                color1: "Red",
                color2: "Black",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>
        </div>
      </section>

      <section>
        <h3 id="jumpIntoBeacon"><a href="#jumpIntoBeacon">jumpIntoBeacon</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Jumps into a beacon to re-augment an optical device.</em></p>
        <p>
          Takes a <strong>Player</strong> card, a <strong>Beacon</strong> card and an optical device that is either a <strong>Torch</strong> or <strong>Glasses</strong> card.
          Produces a card of the same (optical) type but with both lenses changed to the <strong>Beacon</strong> card's color.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1580}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Asymmetry",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Beacon" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Asymmetry",
              tier: "Mortal",
              type: "Beacon",
              color1: "Pink",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>

          <div className={styles.disjunction}>
            <ZoomableCard title="Torch" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Teamwork",
                puzzle: "Asymmetry",
                tier: "Mortal",
                type: "Torch",
                color1: "Red",
                color2: "Green",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Glasses" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Teamwork",
                puzzle: "Asymmetry",
                tier: "Mortal",
                type: "Glasses",
                color1: "Blue",
                color2: "Yellow",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>

          <span className={styles.equals}>=</span>
          <div className={styles.disjunction}>
            <ZoomableCard title="Torch" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Teamwork",
                puzzle: "Asymmetry",
                tier: "Mortal",
                type: "Torch",
                color1: "Pink",
                color2: "Pink",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
            <span className={styles.or}>or</span>
            <ZoomableCard title="Glasses" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
                series: "Teamwork",
                puzzle: "Asymmetry",
                tier: "Mortal",
                type: "Glasses",
                color1: "Pink",
                color2: "Pink",
                variant: "None",
                condition: "Pristine",
                edition: "Standard",
            })} />
          </div>
        </div>
      </section>

      <section>
        <h3 id="jumpIntoEclipse"><a href="#jumpIntoEclipse">jumpIntoEclipse</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Jumps into an eclipse to open a star door.</em></p>
        <p>
          Takes a <strong>Player</strong> card, an <strong>Eclipse</strong> card and a closed <strong>Door</strong> card and produces an open <strong>Door</strong> card.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1150}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Balancing Act II",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Eclipse" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Balancing Act II",
              tier: "Mortal",
              type: "Eclipse",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Door" subtitle="closed" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Balancing Act II",
              tier: "Mortal",
              type: "Door",
              color1: "None",
              color2: "None",
              variant: "Closed",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Door" subtitle="open" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Balancing Act II",
              tier: "Mortal",
              type: "Door",
              color1: "None",
              color2: "None",
              variant: "Open",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>
      </section>

      <section>
        <h3 id="goThroughStarDoor"><a href="#goThroughStarDoor">goThroughStarDoor</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>The player steps through a star door to reach a new area.</em></p>
        <p>
          Takes a <strong>Player</strong> card, an open <strong>Door</strong> card
          and <span className={styles.promotes}>promotes</span> to the tier above. Unlocks minting at the next tier and produces a random <a href="#cardTypes">starter card</a>.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_860}`}>
          <ZoomableCard title="Player" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Star Gazing",
              puzzle: "Mysterious Aura",
              tier: "Mortal",
              type: "Player",
              color1: "None",
              color2: "None",
              variant: "Idle Front",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Door" subtitle="open" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
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

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Random" subtitle="tier above" hideType={true} disabled={true} className={`${styles.recipe_card} ${styles.starter_card}`} autoPlay={false} card={new PuzzleCard({
              series: "Star Gazing",
              puzzle: "Mysterious Aura",
              tier: "Mortal",
              type: "Hidden",
              color1: "None",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>
      </section>

      <section>
        <h3 id="puzzleMastery1"><a href="#puzzleMastery1">puzzleMastery1</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Revisits a puzzle at the end of the game to obtain an elusive star.</em></p>
        <p>
          Takes two <strong>Artwork</strong> cards that have not been signed and produces a <strong>Star</strong> card in a random color.
          The same puzzle must appear on both <strong>Artwork</strong> cards and it will carry over to the <strong>Star</strong> card.
          The artwork can be different.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_860}`}>
          <ZoomableCard title="Artwork" subtitle="same puzzle" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Pitch Black",
              puzzle: "Dark Star",
              tier: "Master",
              type: "Artwork",
              color1: "None",
              color2: "None",
              variant: "Two Torches",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Artwork" subtitle="same puzzle" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Pitch Black",
              puzzle: "Dark Star",
              tier: "Master",
              type: "Artwork",
              color1: "None",
              color2: "None",
              variant: "Overgrown Door",
              condition: "Pristine",
              edition: "Standard",
          })} />

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Star" subtitle="random color" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Teamwork",
              puzzle: "Dark Star",
              tier: "Master",
              type: "Star",
              color1: "Yellow",
              color2: "None",
              variant: "None",
              condition: "Pristine",
              edition: "Standard",
          })} />
        </div>
      </section>

      <section>
        <h3 id="puzzleMastery2"><a href="#puzzleMastery2">puzzleMastery2</a></h3>
        <a className={styles.link_to_top} href="#recipes"><strong>^</strong> top</a>
        <p><em>Demonstrates mastery over the game by collecting a star in every color.</em></p>
        <p>
          Takes seven <strong>Star</strong> cards (one of each color) and produces an <strong>Artwork</strong> card.
          The artwork will be signed by the game's creator (tuzz) in recognition of your achievement and as a token of appreciation for your support.
        </p>
        <p>
          If all of the <strong>Star</strong> cards used in the recipe are in <span className={styles.pristine}>pristine</span> condition then you will receive a Limited Edition card, but only if fewer than 100
          have been claimed for the puzzle on the card. One of these Limited Editions, chosen at random will be the Master Copy of the puzzle. See <a href="#optionalEndgame">Optional Endgame</a>.
        </p>
        <p>
          The puzzle that appears on the <strong>Artwork</strong> card will be randomly chosen based on the <strong>Star</strong> cards.
          If the same puzzle appears on all <strong>Star</strong> cards, that puzzle is guaranteed to appear on the <strong>Artwork</strong> card.
          Otherwise, the probability is weighted based on how many of each puzzle are present.
        </p>

        <div className={`${styles.recipe} ${styles.collapse_below_1110}`}>
          <ZoomableCard title="Star" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Contending Claws",
              puzzle: "Crab Island",
              tier: "Master",
              type: "Star",
              color1: "Red",
              color2: "None",
              variant: "Two Torches",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <ZoomableCard title="Star" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Contending Claws",
              puzzle: "Crab Island",
              tier: "Master",
              type: "Star",
              color1: "Yellow",
              color2: "None",
              variant: "Overgrown Door",
              condition: "Pristine",
              edition: "Standard",
          })} />
          <span className={styles.plus}>+</span>
          <span className={styles.ellipsis}>...</span>

          <span className={styles.equals}>=</span>
          <ZoomableCard title="Artwork" className={styles.recipe_card} autoPlay={false} card={new PuzzleCard({
              series: "Contending Claws",
              puzzle: "Crab Island",
              tier: "Master",
              type: "Artwork",
              color1: "None",
              color2: "None",
              variant: "Player Sketch",
              condition: "Pristine",
              edition: "Limited",
          })} />
        </div>
      </section>
    </div>
  </div>
);

export default HowToPlay;
