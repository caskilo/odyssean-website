---
title: "Why Most Efforts Towards “Democratic AI” Fall Short"
description: "Why efforts towards \"democratic AI\" like OpenAI's fail to deliver real public control. An analysis of current initiatives and what genuine AI democracy requires."
author: "Jacob Haimes"
published: 2025-09-29T20:41:41.130Z
readTime: "8 min read"
cover:
  src: "../../assets/media/posts/why-democratic-ai-falls-short/a-computer-monitor-with-a-parody-of-a-tech-company-logo-floa-aca8f1.png"
  alt: "A computer monitor with a parody of a tech company logo floats on the waves while human hands reach up from the depths."
sources:
  - kind: live
    ref: "https://www.odysseaninstitute.org/post/why-democratic-ai-falls-short"
---

Rose Willis & Kathryn Conrad / [Better Images of AI](https://betterimagesofai.org) / A Rising Tide Lifts All Bots / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Setting the Stage

Companies and venture capital firms can’t get enough of so called artificial intelligence (AI), with private investments in generative AI increasing by nine times from 2022 to 2023 [\[1\]](#ref-1), and tech giants Alphabet (Google), Amazon, Meta, and Microsoft projected to invest more than 1 trillion USD into AI over the next five years [\[2\]](#ref-2).

The general public, however, are not as convinced. Multiple 2024 polls show that the most common sentiments held by US adults with regards to recent advances in AI are *caution* and *concern* [\[3\]](#ref-3)[\[4\]](#ref-4), and a majority have little-to-no confidence that technology companies developing AI will do so responsibly [\[5\]](#ref-5). This opinion is shared globally with frequent calls for government regulation from countries both leading in AI development (US, UK, China) and those who face the risk of being excluded from consideration in it (Brazil, South Korea, India) [\[6\]](#ref-6).

A frequent suggestion to resolve this is to democratise AI, which on first inspection sounds incredibly attractive. In practice, however, the processes that are typically called for and conducted are superficial at best, and can even be twisted to promote the appearance of egalitarianism without making any meaningful changes, as is noted in ‘Against “Democratizing AI”’ [\[7\]](#ref-7).

## What Does “Democratising AI” Actually Mean?

Before moving forward, it is important to note what I mean by democratising AI, as there are two often-conflated interpretations:

1.  **Democratising access –** making both use and development of AI tools readily available to all.

2.  **Democratising governance –** involving public voices in AI design, deployment, and policy.

These aims are fundamentally different approaches, and despite ambiguity, should not be treated as interchangeable. Most of those advocating for democratic AI are pursuing the first interpretation, inputs and methods for the development and use of these systems, but ambiguity between these framings has made discourse more difficult on both fronts. In this article, we focus on democratic design and implementation of AI, not questions of access.

The focus of this thought piece is the latter, *governance,* which many advocates treat as a cure-all without clear mechanisms or authority.

## Major Attempts and Actors

A wide range of institutions have begun exploring how public input might shape AI development, from governments and multinational coalitions to tech companies and civil society organizations.

| **Entity Type** | **Example Actors** | **Approach** | **Outputs** |
| --- | --- | --- | --- |
| Governments | EU, Brazil, UN, OECD | Policy development, legislative processes, risk-based frameworks, public comment | [EU AI Act](https://artificialintelligenceact.eu/), [UN Secretary-General Advisory Body](https://www.un.org/en/ai-advisory-body), [UNESCO’s Recommendation on the Ethics of Artificial Intelligence](https://www.unesco.org/en/articles/recommendation-ethics-artificial-intelligence) (2021) |
| Civil Society | CIP, AI Now, Data & Society, Mozilla | Advocacy, litigation, ethical frameworks, public education | [CI Stack](https://www.cip.org/whitepaper), [Algorithmic Justice League](https://www.ajl.org/) |
| Tech Companies | OpenAI, DeepMind, Meta | Grants, red teaming, citizen panels, internal ethics boards | [OpenAI’s grant program](https://openai.com/index/democratic-inputs-to-ai-grant-program-update/), “ethics + society” teams, “Community Feedback” |
| Individuals | Audrey Tang, Timnit Gebru, Glen Weyl | Philosophical, technical, and institutional experimentation | [RadicalxChange](https://www.radicalxchange.org/), universal voting on model behaviors |

I’m sure I’ve missed a few, but this table provides a starting point for exploring this space. Despite the apparent breadth of activity, very little has been done to follow through on these calls. Two stand out for their ambition and influence: OpenAI’s “Democratic Inputs” program [\[8\]](#ref-8) and the Collective Intelligence Project (CIP) [\[9\]](#ref-9).

### OpenAI - Democratic Inputs to AI

In 2023, OpenAI launched the “Democratic Inputs to AI” program, funding 10 global teams to test new ways of surfacing public preferences about AI behavior, developing a “democratic processes for overseeing AGI.” The grantees explored approaches ranging from deliberative polling to community-led red teaming, with the aim of informing how powerful models should behave [\[10\]](#ref-10).

The call for proposals included many implicit assumptions [\[11\]](#ref-11). In essence, OpenAI did not ask “how can we ensure we develop our systems in a democratic way,” but instead asked “how can systems like ours improve democracy?” This framing presumes (i) that AI can and should be used in this context, and (ii) that AI, as it currently exists, is a permanent and justified fixture in our society.

*Although beyond the scope of this article, credible arguments have been presented to question both. For example, the use of AI for scaling democratic deliberation has significant potential to result in over-reliance* [*\[12\]*](#ref-12)*, exposing deliberative practice to private capture or technical vulnerabilities.*

Furthermore, participation from the grantees in the program is purely advisory; governance power still lies with the lab itself. The initiative reflects openness to feedback, but does not commit to ceding control [\[8\]](#ref-8). As such, it remains a first step toward legitimacy, not a democratic system in practice.

Interestingly, when combined with the other assumptions hidden in the press release, OpenAI’s efforts look a lot more like market research masquerading as a public good. The experiments remain disconnected from OpenAI’s core release decisions which continue to prioritize fast growth: monetization and scale. This includes a recent $200 million contract with the U.S. Department of Defense to “develop frontier AI capabilities” and includes the appointment of several senior OpenAI execs as Lieutenant Colonels in the US Army Reserve along with leaders from other prominent tech companies like Meta [\[13\]](#ref-13). These developments run counter to the equitable and peaceful democratic efforts they’d publicly committed to.

### Collective Intelligence Project (CIP) - CCAI

The Collective Intelligence Project proposes a deeper institutional shift: embedding democratic processes into the architecture of AI governance. Rather than rely on lab-led consultation, CIP argues for building “civic layer” infrastructure to enable scalable public participation in shaping AI norms and deployment [\[9\]](#ref-9).

Their proposed "CI Stack" includes:

1.  **Value elicitation –** Tools like Pol.is or deliberative assemblies to surface shared public values.

2.  **Decision-making –** Sortition-based councils or other participatory methods for resolving tradeoffs.

3.  **Implementation –** Operational links to model governance or platform rules.

Their first major effort, CCAI, was a collaboration with Anthropic to create a set of rules which would influence a chatbot's behavior, sourced from a representative sample of crowd workers in the United States [\[14\]](#ref-14). This effort suffered from the same assumptions as OpenAI’s democratic inputs projects; the artifact created as a result of this process, a so-called constitution, only informs parts of the reinforcement learning (RL) process, meaning that all other development is accepted as-is [\[15\]](#ref-15).

In addition, the entries in this list of “shoulds” and “should-nots” made it clear that whatever method was used simply isn’t enough to achieve an informed and valid democratic process with which to design AI systems. Statements from the original output list include [\[16\]](#ref-16):

*“AI should be more convenient,”*

*“say when it doesn't know,”*

*“AI should be controlled and have limits,” and*

*“The AI should state that it does not have the definite answers to everything, or anything. In general.”*

These statements indicate the lack of context provided to the participants regarding (i) the purpose of the task, and (ii) the fundamental limitations of language models. Importantly, *this is not the fault of the participants,* it implies that more efforts should have been made to ensure a certain level of understanding by the organisers. The Odyssean Process acknowledges the inherent difficulty of this task, and leverages a wide literature on debiased expert elicitation, exploratory modeling, decision support, and citizen deliberation to provide participants what they need to robustly parse potential interventions [\[17\]](#ref-17).

## Why Efforts Fall Short - In Brief

### Structural Weaknesses

-   **Company-driven models –** Labs setting the agenda benefit from positive optics, not real institutional checks.

-   **Input without power –** Public feedback often ends up as market research (e.g. supplementing RLHF tuning), not a genuine policy mechanism.

-   **Market over democracy –** Participation is often superficial unless backed by enforceable structures.

### Conceptual and Pragmatic Flaws

-   **Participation ≠ authority –** More voices doesn’t necessarily mean decision-making power [\[18\]](#ref-18).

-   **Elite capture & bias –** Who participates? Often familiar, connected, and English-speaking voices dominate.

-   **Snapshot vs. continuity –** Democracy is a process, not a one-time survey or poll.

-   **Misplaced trust in AI as an oracle or cure-all –** Expecting models to resolve moral ambiguity mislabels democratic work .

Johannes Himmelreich casts a crucial spotlight:

> “Such a democratization of AI … is resource intensive … morally myopic … and neither theoretically nor practically the right kind of response”

He argues that instead of more participation, we should **raise the democratic quality** of administrative and executive processes.

Existing efforts attempt to put democracy into predefined systems, which assumes that the system is part of the solution. While language models likely are a good tool to leverage in some cases, we need a framework to validate this. Current efforts are ultimately an oversimplification of the problem, and are too corporate aligned for their own good. This is likely to lead to public spending on private market research, as well as unnecessarily complex and redundant solutions that line the pockets of those already in power [\[19\]](#ref-19).

## Democracy Demands More

We risk converting democratisation into a symbolic gesture unless participation is tied to structural authority and ongoing adaptation. Only by embedding democratic purpose at the core, through enforceable institutions and continuous feedback, can AI development truly reflect collective power, not performative input.

We understand how complex and fraught with risk both regulating transformative technology, and innovating sociopolitical systems can be. We intend to conduct the first Odyssean Process in full, built of components with strong track records for robust and legitimate collective intelligence, in 2026. This piece serves as a call to action to proceed as boldly, but also as diligently, as possible. Ensuring democratic engagement on AI governance does what it says on the tin: empower those impacted by AI to contribute to pivotal regulatory efforts, not the other way around.

## Acknowledgements

While I was the primary author of this blogpost, I would not have been able to write it without the significant assistance from Kendal Peirce and Giuseppe Dal Prá, as well as feedback from Max Ramsahoye.

## References

<span id="ref-1"></span>\[1\] [AI Index Report 2024](https://hai.stanford.edu/ai-index/2024-ai-index-report), Stanford Human-centered AI

<span id="ref-2"></span>\[2\] [Comparing Major Companies' AI Spending in 2024 and the Challenge of Productionizing AI Solutions](https://web.archive.org/web/20260310152522/https://council.aimresearch.co/comparing-major-companies-ai-spending-in-2024-and-the-challenge-of-productionizing-ai-solutions/), AIM Councils

<span id="ref-3"></span>\[3\] [Americans' top feeling about AI: caution](https://today.yougov.com/technology/articles/49099-americans-2024-poll-ai-top-feeling-caution), YouGov

<span id="ref-4"></span>\[4\] [Do Americans think AI will have a positive or negative impact on society?](https://today.yougov.com/technology/articles/51368-do-americans-think-ai-will-have-positive-or-negative-impact-society-artificial-intelligence-poll), YouGov

<span id="ref-5"></span>\[5\] [YouGov Survey: Artificial Intelligence](https://d3nkl3psvxxpe9.cloudfront.net/documents/Artificial_Intelligence_poll_results.pdf), YouGov

<span id="ref-6"></span>\[6\] [BRICS leaders to call for data protections against unauthorized AI use](https://www.reuters.com/world/china/brics-leaders-call-data-protections-against-unauthorized-ai-use-2025-07-06/?utm_source=chatgpt.com), Reuters

<span id="ref-7"></span>\[7\] [Against "Democratizing AI"](https://web.archive.org/web/20260131102419/https://johanneshimmelreich.net/papers/against-democratizing-AI.pdf), Johannes Himmelreich

<span id="ref-8"></span>\[8\] [Democratic inputs to AI](https://openai.com/index/democratic-inputs-to-ai/), OpenAI

<span id="ref-9"></span>\[9\] [The Collective Intelligence Project Whitepaper](https://www.cip.org/whitepaper), The Collective Intelligence Project

<span id="ref-10"></span>\[10\] [Democratic inputs to AI grant program: lessons learned and implementation plans](https://openai.com/index/democratic-inputs-to-ai-grant-program-update/)

<span id="ref-11"></span>\[11\] [Bringing AI Participation Down to Scale: A Comment on Open AIs Democratic Inputs to AI Project](https://arxiv.org/pdf/2407.11613), Moats and Ganguly

<span id="ref-12"></span>\[12\] [Your Brain on ChatGPT: Accumulation of Cognitive Debt when Using an AI Assistant for Essay Writing Task](https://arxiv.org/abs/2506.08872), Kosmyna et al.

<span id="ref-13"></span>\[13\] [US Army appoints Palantir, Meta, OpenAI execs as Lt. Colonels](https://thegrayzone.com/2025/06/18/palantir-execs-appointed-colonels/), The Grayzone

<span id="ref-14"></span>\[14\] [CIP and Anthropic launch Collective Constitutional AI](https://www.cip.org/blog/ccai), The Collective Intelligence Project

<span id="ref-15"></span>\[15\] [Collective Constitutional AI: Aligning a Language Model with Public Input](https://www.anthropic.com/news/collective-constitutional-ai-aligning-a-language-model-with-public-input), Anthropic

<span id="ref-16"></span>\[16\] [Community Model Library - Original CCAI](https://cm.cip.org/library), Community Models (CIP)

<span id="ref-17"></span>\[17\] [The Odyssean Process Whitepaper](/files/odyssean-process-white-paper-2024.pdf), The Odyssean Institute

<span id="ref-18"></span>\[18\] [A Ladder Of Citizen Participation](https://www.tandfonline.com/doi/abs/10.1080/01944366908977225), Arnstein

<span id="ref-19"></span>\[19\] [Artificial Power: 2025 Landscape Report](https://ainowinstitute.org/publications/research/ai-now-2025-landscape-report), AI Now Institute

*While not explicitly referenced in the text, the following sources were consulted and informed the writing this blogpost.*

\[20\] [Inside OpenAI's Plan to Make AI More 'Democratic'](https://time.com/6684266/openai-democracy-artificial-intelligence/), TIME

\[21\] [CIP Annual Report 2024](https://2024.cip.org), The Collective Intelligence Project

\[22\] [A Roadmap to Democratic AI](https://www.cip.org/research/ai-roadmap), The Collective Intelligence Project

\[23\] [AI Risk Prioritization: OpenAI Alignment Assembly Report](https://www.cip.org/research/participatory-ai-risk-prioritization), The Collective Intelligence Project

\[24\] [Democratising AI: Multiple Meanings, Goals, and Methods](https://arxiv.org/abs/2303.12642), Seger et al.

\[25\] [Integrating Artificial Intelligence into Citizens’ Assemblies: Benefits, Concerns and Future Pathways](https://delibdemjournal.org/article/id/1556/), McKinney

\[26\] [Particip-AI: A Democratic Surveying Framework for Anticipating Future AI Use Cases, Harms and Benefits](https://arxiv.org/abs/2403.14791), Mun et al.

\[27\] [Better Together? The Role of Explanations in Supporting Novices in Individual and Collective Deliberations about AI](https://arxiv.org/abs/2411.11449), Schmude et al.

\[28\] [AGI and Democracy](https://ash.harvard.edu/resources/agi-and-democracy/), Ash Center

\[29\] [Series 4: Enabling Secure Democratic Ecosystems Through AI](https://www.ie.edu/cgc/news-and-events/news/ai4democracy-series-4-enabling-secure-democratic-ecosystems-through-ai/), AI4Democracy

\[30\] [AI Democracy Projects](https://www.ias.edu/stsv-lab/ai-democracy-projects), Institute for Advanced Study

\[31\] [Launch of “Democratic Commons” The first global research program to build AI in service of Democracy](https://www.sorbonne-universite.fr/en/press-releases/ai-democracy-launch-democratic-commons-first-global-research-program-build-ai), Sorbonne Université

\[32\] [The Case for Local and Regional Public Engagement in Governing Artificial Intelligence](https://www.demnext.org/projects/ailocalism), DemocracyNext
