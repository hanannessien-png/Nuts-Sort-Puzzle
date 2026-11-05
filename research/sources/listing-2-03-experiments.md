Source: https://support.google.com/googleplay/android-developer/answer/6227309
Title: Run A/B tests on your store listing - Play Console Help
Fetched: 2026-11-05T01:40:58.385Z

[Skip to main content](https://support.google.com/googleplay/android-developer/answer/12053285?visit_id=639294396571620341-3485453539&rd=1#hcfe-content)

# Run A/B tests on your store listing

To give developers more control and statistical robustness we've recently made some changes to store listing experiments in Play Console. We've made improvements in a few key areas:

- underlying data;
- a calculator to estimate time to completion; and
- improved the flows to guide you to the most optimal testing setup.

This page has been updated to reflect these changes.

To help optimize your store listing on Google Play, you can run experiments to find the most effective graphics and text for your app. You can run experiments for your default and [custom store listings](https://support.google.com/googleplay/android-developer/answer/9156429).

For published apps, you can test variants against your current version to see which one performs best based on install/open data. Before setting up a test, review the best practices for [running effective experiments](https://developer.android.com/distribute/best-practices/grow/store-listing-experiments.html#best-practices).

**Note**: Global experiments have been renamed to default graphics experiments. They maintain the same functionality that they had prior to being renamed.

## Experiment types

For each app, you can run one default graphics experiment or up to five localized experiments at the same time.

### Default graphics

Using a default graphics experiment, you can experiment with graphics in your app's default Store Listing language. You can include variants of your app's icon, feature graphic, and screenshots.

- **If your app's store listing is only available in one language**: Default graphics experiments will be shown to all users.
- **If you've added any localized graphic assets in a specific language**: Users viewing your app in that language are excluded from your app's default graphics experiments. For example, if your app's default language is English and it has a localized feature graphic in French, users viewing your app in French will be excluded from the experiment (even if you're testing your icon).

### Localized (for text and graphics)

Using a localized experiment, you can experiment with your app's icon, feature graphic, screenshots, and/or your app's descriptions in up to five languages. Experiment variants will only be shown to users viewing your app's store listing in the languages you choose.

If your app's store listing is only available in one language, localized experiments will only be shown to users viewing your app in its default language.

## Create an experiment

To create an experiment in Play Console:

1. Sign in to Play Console and go to the **[Store listings](https://play.google.com/console/developers/app/store-listing-experiments/create)** page ( **Grow users** \> **Store presence** \> **Store listings**).
2. In the 'Experiment' column for a store listing, click **Set up**.

Alternatively, click the arrow at the right end of the row to open the **Details** page for that store listing, then click **Set up experiment** if it’s available. If it’s not available, follow the prompt at the top of the **Details** page to fully roll out your store listing and get it ready for experiments, then return to this step to set up your experiment.

3. Enter the experiment details:

- **Experiment name**: Enter the name of your experiment (50 characters or fewer). **Note:** This name is just for your convenience. Users won't see it.
- **Experiment type**:Choose **Graphics experiment on default listing** or **Experiment on a localized listing**. For localized listings, select the languages you want to test.
- **Target metric**: The metric used to determine your experiment’s result. Choose **Unique user install clicks, Unique user open clicks** or **Unique user pre-registration clicks**.

The experiment creation page estimates the time and number of acquisition, opens or pre-registrations your experiment will need to show a statistically significant result.

4. (Optional) Review the advanced settings. The default experiment settings will give you results in the shortest time with reasonable accuracy, and changing them can make your experiment run for longer before providing useful results, but if necessary you can adjust the following:

- **Number of variants**:The number of experimental variants to test against the current store listing (you can choose up to 2 variants).
- **Experiment audience percentage**:The percentage of store listing user impressions that will see an experimental variant instead of the current listing. These user impressions will be split equally across your experimental variants.
- **Minimum detectable effect**:The minimum difference between variants and control required to declare which performs better. If the difference is less than this, your experiment will be considered a draw.
- **Confidence level**: How often the confidence interval provided by the experiment will contain the true performance of the store listing. Increasing the confidence level decreases the likelihood of a false positive.

5. Click **Next**.
6. Select the type of asset you want to test. We recommend testing changes to one asset at a time, so you can be as certain as possible of what causes any changes to your store listing performance.
7. Provide the test variants of the asset.
8. Review your asset variants, then click **Save**. You now have the option to return to the **Details** page, or go to the publishing overview page to submit your changes for review.

## Review and apply results

To review and apply your results:

1. Sign in to Play Console and go to the **[Store listings](https://play.google.com/console/developers/app/store-listing-experiments/create)** page ( **Grow users** \> **Store presence** \> **Store listings**).
2. You can view the status of your experiments in a few ways.

- The **Experiments** tab shows all your experiments, and you can navigate to your specific experiment from there.
- In the **Listings** tab, click the cell in the 'Experiment' column for your chosen store listing to view the experiments associated with this listing.
- In the **Listings** tab, click the right arrow in the row for your chosen store listing to view details, including information about all experiments you’ve run on that listing.

3. In the 'Results' section, view a summary of your experiment's results based on your target metric.




    The results tell you which of the options is performing best, or performing better than your current Store Listing. You'll also see an explanation of this result, based on its confidence interval and minimum detectable effect, and a recommended action (if applicable). You may receive the result "More data needed" if not enough data has been collected to return a result.
4. Your next action depends on your experiment results:

- If a variant performed well, you may see a recommendation to apply that variant.
- If your result is "More data needed," come back later. We will advise if you have less than a week before we expect a result to be ready.
- If more than one variant performed better than your current listing, or if your result was a "Draw," review the results to decide which variant you want to apply.
  - If your current store listing performed the best, click **Keep current listing**.

#### User metrics

| Metric | Definition |
| --- | --- |
| Unique user install clicks | The number of users who installed your app, who didn't have it installed on any other devices at the time. |
| Unique user open clicks | The number of installed users who opened your app. |
| Unique user pre-registration clicks | The number of users who have pre-registered for your app. |

## Experiment autocompletion

Store listing experiments stop automatically after running for 6 months. After this time, no new data will be collected, no variantswill be applied, and traffic will revert to the current listing. You can still access your completed experiment in Play Console and see the data it collected.

## Sign up for experiment notifications

To receive notifications and email when your experiments are complete, make sure that you set your preferences on the **[Email notifications](https://play.google.com/console/developers/preferences)** page in Play Console.

To learn more about email notifications, go to [manage your developer account information](https://support.google.com/googleplay/android-developer/answer/139626).

Give feedback about this article

Choose a section to give feedback on

## Was this helpful?

How can we improve it?

YesNo

Submit

## Need more help?

### Try these next steps:

[Post to the help community  Get answers from community members](https://support.google.com/googleplay/android-developer/community?hl=en&help_center_link=CKXW3wUSI1J1biBBL0IgdGVzdHMgb24geW91ciBzdG9yZSBsaXN0aW5n) [Contact usTell us more and we’ll help you get there](https://support.google.com/googleplay/android-developer/gethelp)

false

13078452296857742390

true

Search Help Center

false

true

true

true

[Google Help](https://support.google.com/)

[Help Center](https://support.google.com/googleplay/android-developer/?hl=en)

[Play Console Help](https://support.google.com/googleplay/android-developer/topic/3308856?hl=en&ref_topic=9857238,2856718,) [Policy Center](https://support.google.com/googleplay/android-developer/topic/9858052?hl=en&ref_topic=9857238,2856718,)

[Community](https://support.google.com/googleplay/android-developer/community?hl=en&help_center_link=CKXW3wUSI1J1biBBL0IgdGVzdHMgb24geW91ciBzdG9yZSBsaXN0aW5n) [Play Console](https://play.google.com/apps/publish/)

[Privacy Policy](https://www.google.com/intl/en/privacy.html) [Terms of Service](https://www.google.com/accounts/TOS)Submit feedback

[Get started](https://support.google.com/googleplay/android-developer/topic/3450769?hl=en&ref_topic=3308856,9857238,2856718,) [Popular articles](https://support.google.com/googleplay/android-developer/topic/12233401?hl=en&ref_topic=3308856,9857238,2856718,) [Manage your developer account](https://support.google.com/googleplay/android-developer/topic/16285?hl=en&ref_topic=3308856,9857238,2856718,) [Create, upload, and publish](https://support.google.com/googleplay/android-developer/topic/7072031?hl=en&ref_topic=3308856,9857238,2856718,) [Distribute your app](https://support.google.com/googleplay/android-developer/topic/7071529?hl=en&ref_topic=3308856,9857238,2856718,) [Run tests and check performance](https://support.google.com/googleplay/android-developer/topic/7071528?hl=en&ref_topic=3308856,9857238,2856718,) [Protect your app](https://support.google.com/googleplay/android-developer/topic/13878452?hl=en&ref_topic=3308856,9857238,2856718,) [Comply with Google Play policies](https://support.google.com/googleplay/android-developer/topic/2364761?hl=en&ref_topic=3308856,9857238,2856718,) [Fix an issue](https://support.google.com/googleplay/android-developer/topic/15868?hl=en&ref_topic=3308856,9857238,2856718,) [Android developer verification](https://support.google.com/googleplay/android-developer/topic/16689288?hl=en&ref_topic=3308856,9857238,2856718,) [Design for multiple form factors](https://support.google.com/googleplay/android-developer/topic/18106546?hl=en&ref_topic=3308856,9857238,2856718,) [Central Play Help Center](https://support.google.com/googleplay/android-developer/topic/14160281?hl=en&ref_topic=3308856,9857238,2856718,)

[Restricted Content](https://support.google.com/googleplay/android-developer/topic/9877466?hl=en&ref_topic=9858052,9857238,2856718,) [Intellectual Property](https://support.google.com/googleplay/android-developer/topic/9876963?hl=en&ref_topic=9858052,9857238,2856718,) [Privacy, Deception and Device Abuse](https://support.google.com/googleplay/android-developer/topic/9877467?hl=en&ref_topic=9858052,9857238,2856718,) [Use of SDKs In Apps](https://support.google.com/googleplay/android-developer/topic/15406736?hl=en&ref_topic=9858052,9857238,2856718,) [Malware](https://support.google.com/googleplay/android-developer/topic/9975838?hl=en&ref_topic=9858052,9857238,2856718,) [Impersonation](https://support.google.com/googleplay/android-developer/topic/9969539?hl=en&ref_topic=9858052,9857238,2856718,) [Mobile Unwanted Software](https://support.google.com/googleplay/android-developer/topic/9969691?hl=en&ref_topic=9858052,9857238,2856718,) [Monetization and Ads](https://support.google.com/googleplay/android-developer/topic/9857752?hl=en&ref_topic=9858052,9857238,2856718,) [Store Listing and Promotion](https://support.google.com/googleplay/android-developer/topic/9877064?hl=en&ref_topic=9858052,9857238,2856718,) [Spam, Functionality, and User Experience](https://support.google.com/googleplay/android-developer/topic/9876964?hl=en&ref_topic=9858052,9857238,2856718,) [Other Programs](https://support.google.com/googleplay/android-developer/topic/9876660?hl=en&ref_topic=9858052,9857238,2856718,) [Families](https://support.google.com/googleplay/android-developer/topic/9877766?hl=en&ref_topic=9858052,9857238,2856718,) [Enforcement](https://support.google.com/googleplay/android-developer/topic/9877468?hl=en&ref_topic=9858052,9857238,2856718,) [Updates and Other Resources](https://support.google.com/googleplay/android-developer/topic/9877065?hl=en&ref_topic=9858052,9857238,2856718,) [How Google Play Works for Developers](https://support.google.com/googleplay/android-developer/topic/9958765?hl=en&ref_topic=9858052,9857238,2856718,)

true

true

92637

false

false

## What is the issue with this selection?

What is the issue with this selection?

Inaccurate - doesn't match what I see in the product

Hard to understand - unclear or translation is wrong

Missing info - relevant but not comprehensive

Irrelevant - doesn’t match the title and / or my expectations

Minor errors - formatting issues, typos, and / or broken links

Other suggestions - ideas to improve the content

## Share additional info or suggestions

​

​

Do not share any personal info

Cancel

Submit

By continuing, you agree Google uses your answers, [account & system info](https://support.google.com/googleplay/android-developer/answer/12053285?visit_id=639294396571620341-3485453539&rd=1#) to improve services, per our [Privacy](https://myaccount.google.com/privacypolicy?hl=en) & [Terms](https://policies.google.com/terms?hl=en).

false

false

false

Search

Clear search

Close search

Main menu

Google apps