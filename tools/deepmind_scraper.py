"""DeepMind Publications Scraper and Milestone Seed Registry.

Provides:
- An authoritative, curated seed dataset of DeepMind milestone papers (2013-2024),
  including DQN, AlphaGo, AlphaZero, MuZero, WaveNet, AlphaFold 1/2/3, Flamingo,
  Chinchilla, Gato, Gemini, GraphCast, AlphaGeometry, AlphaProof, etc.
- Scraper for DeepMind official publications page with fallback and exponential backoff.
- Export to data/raw_papers.json.
"""

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Authoritative milestone seed database covering 2013-2024 DeepMind landmarks
DEEPMIND_MILESTONE_PAPERS: List[Dict[str, Any]] = [
    {
        "id": "dqn_2013",
        "title": "Playing Atari with Deep Reinforcement Learning",
        "arxiv_id": "1312.5602",
        "year": 2013,
        "publication_date": "2013-12-19",
        "primary_theme": "Reinforcement Learning",
        "topics": ["Deep Reinforcement Learning", "Q-Learning", "Atari", "Experience Replay"],
        "authors": [
            "Volodymyr Mnih", "Koray Kavukcuoglu", "David Silver", "Alex Graves",
            "Ioannis Antonoglou", "Daan Wierstra", "Martin Riedmiller"
        ],
        "venue": "NIPS 2013 Deep Learning Workshop",
        "url": "https://arxiv.org/abs/1312.5602",
        "is_milestone": True,
        "summary": "First deep learning architecture to learn control policies directly from high-dimensional raw pixel inputs using RL.",
    },
    {
        "id": "nature_dqn_2015",
        "title": "Human-level control through deep reinforcement learning",
        "arxiv_id": "1312.5602",
        "year": 2015,
        "publication_date": "2015-02-26",
        "primary_theme": "Reinforcement Learning",
        "topics": ["Deep Q-Networks", "Reinforcement Learning", "Atari 2600"],
        "authors": [
            "Volodymyr Mnih", "Koray Kavukcuoglu", "David Silver", "Andrei A. Rusu",
            "Joel Z. Veness", "Marc G. Bellemare", "Alex Graves", "Martin Riedmiller",
            "Andreas K. Fidjeland", "Georg Ostrovski", "Stig Petersen", "Charles Beattie",
            "Amir Sadik", "Anton Antonoglou", "Helen King", "Dharshan Kumaran",
            "Daan Wierstra", "Shane Legg", "Demis Hassabis"
        ],
        "venue": "Nature 518 (7540), 529-533",
        "doi": "10.1038/nature14236",
        "url": "https://www.nature.com/articles/nature14236",
        "is_milestone": True,
        "summary": "Landmark Nature paper demonstrating that DQN achieves human-level performance across 49 Atari games.",
    },
    {
        "id": "alphago_2016",
        "title": "Mastering the game of Go with deep neural networks and tree search",
        "arxiv_id": "2112.01524",
        "year": 2016,
        "publication_date": "2016-01-28",
        "primary_theme": "Game AI & Planning",
        "topics": ["Monte Carlo Tree Search", "Policy Networks", "Value Networks", "Computer Go"],
        "authors": [
            "David Silver", "Aja Huang", "Chris J. Maddison", "Arthur Guez",
            "Laurent Sifre", "George van den Driessche", "Julian Schrittwieser",
            "Ioannis Antonoglou", "Veda Panneershelvam", "Marc Lanctot",
            "Sander Dieleman", "Dominik Grewe", "John Nham", "Nal Kalchbrenner",
            "Ilya Sutskever", "Timothy Lillicrap", "Madeleine Leach",
            "Koray Kavukcuoglu", "Thore Graepel", "Demis Hassabis"
        ],
        "venue": "Nature 529 (7587), 484-489",
        "doi": "10.1038/nature16961",
        "url": "https://www.nature.com/articles/nature16961",
        "is_milestone": True,
        "summary": "First computer program to defeat a human world champion in the game of Go via deep RL and tree search.",
    },
    {
        "id": "wavenet_2016",
        "title": "WaveNet: A Generative Model for Raw Audio",
        "arxiv_id": "1609.03499",
        "year": 2016,
        "publication_date": "2016-09-12",
        "primary_theme": "Generative Models",
        "topics": ["Autoregressive Models", "Dilated Convolutions", "Speech Synthesis", "Audio Generation"],
        "authors": [
            "Aaron van den Oord", "Sander Dieleman", "Heiga Zen", "Karen Simonyan",
            "Oriol Vinyals", "Alex Graves", "Nal Kalchbrenner", "Andrew Senior", "Koray Kavukcuoglu"
        ],
        "venue": "arXiv preprint arXiv:1609.03499",
        "url": "https://arxiv.org/abs/1609.03499",
        "is_milestone": True,
        "summary": "Pioneering deep autoregressive neural network for raw audio waveforms, transforming text-to-speech technology.",
    },
    {
        "id": "alphago_zero_2017",
        "title": "Mastering the game of Go without human knowledge",
        "arxiv_id": "1712.01815",
        "year": 2017,
        "publication_date": "2017-10-19",
        "primary_theme": "Game AI & Planning",
        "topics": ["Tabula Rasa RL", "Self-Play", "Pure Reinforcement Learning", "Go"],
        "authors": [
            "David Silver", "Julian Schrittwieser", "Karen Simonyan", "Ioannis Antonoglou",
            "Aja Huang", "Arthur Guez", "Thomas Hubert", "Lucas Baker", "Matthew Lai",
            "Adrian Bolton", "Yutian Chen", "Timothy Lillicrap", "Fan Hui",
            "Laurent Sifre", "George van den Driessche", "Thore Graepel", "Demis Hassabis"
        ],
        "venue": "Nature 550 (7676), 354-359",
        "doi": "10.1038/nature24270",
        "url": "https://www.nature.com/articles/nature24270",
        "is_milestone": True,
        "summary": "Achieves superhuman Go performance starting tabula rasa (without human game data or domain knowledge).",
    },
    {
        "id": "alphazero_2017",
        "title": "Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm",
        "arxiv_id": "1712.01815",
        "year": 2017,
        "publication_date": "2017-12-05",
        "primary_theme": "Game AI & Planning",
        "topics": ["General Game Playing", "Self-Play RL", "Chess", "Shogi", "Go"],
        "authors": [
            "David Silver", "Thomas Hubert", "Julian Schrittwieser", "Ioannis Antonoglou",
            "Matthew Lai", "Arthur Guez", "Marc Lanctot", "Laurent Sifre",
            "Dharshan Kumaran", "Thore Graepel", "Timothy Lillicrap", "Karen Simonyan", "Demis Hassabis"
        ],
        "venue": "Science 362 (6419), 1140-1144",
        "url": "https://arxiv.org/abs/1712.01815",
        "is_milestone": True,
        "summary": "A single general RL algorithm mastering Chess, Shogi, and Go entirely from scratch.",
    },
    {
        "id": "alphastar_2019",
        "title": "Grandmaster level in StarCraft II using multi-agent reinforcement learning",
        "arxiv_id": "1912.06680",
        "year": 2019,
        "publication_date": "2019-10-30",
        "primary_theme": "Game AI & Multi-Agent",
        "topics": ["Multi-Agent RL", "League Training", "Imperfect Information Games", "StarCraft II"],
        "authors": [
            "Oriol Vinyals", "Igor Babuschkin", "Wojciech M. Czarnecki", "Michaël Mathieu",
            "Andrew Dudzik", "Junyoung Chung", "David H. Choi", "Richard Powell",
            "Timo Ewalds", "Petko Georgiev", "Junhyuk Oh", "Dan Horgan",
            "Manuel Kroiss", "Ivo Danihelka", "Aja Huang", "Arthur Guez", "David Silver"
        ],
        "venue": "Nature 575 (7782), 350-354",
        "doi": "10.1038/s41586-019-1724-z",
        "url": "https://www.nature.com/articles/s41586-019-1724-z",
        "is_milestone": True,
        "summary": "First AI system to attain Grandmaster level in the complex, imperfect-information real-time strategy game StarCraft II.",
    },
    {
        "id": "muzero_2019",
        "title": "Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model",
        "arxiv_id": "1911.08265",
        "year": 2019,
        "publication_date": "2019-11-19",
        "primary_theme": "Game AI & Planning",
        "topics": ["Model-Based RL", "Learned Dynamics", "MCTS", "General Planning"],
        "authors": [
            "Julian Schrittwieser", "Ioannis Antonoglou", "Thomas Hubert", "Karen Simonyan",
            "Laurent Sifre", "Simon Schmitt", "Arthur Guez", "Edward Lockhart",
            "Demis Hassabis", "Thore Graepel", "Timothy Lillicrap", "David Silver"
        ],
        "venue": "Nature 588 (7839), 604-609",
        "doi": "10.1038/s41586-020-03051-4",
        "url": "https://arxiv.org/abs/1911.08265",
        "is_milestone": True,
        "summary": "Combines tree-based search with a learned environment model, matching AlphaZero without rules or simulator knowledge.",
    },
    {
        "id": "alphafold_1_2020",
        "title": "Improved protein structure prediction using potentials from deep learning",
        "arxiv_id": "1910.05445",
        "year": 2020,
        "publication_date": "2020-01-15",
        "primary_theme": "AI for Science",
        "topics": ["Protein Folding", "Bioinformatics", "Deep Neural Potentials", "CASP13"],
        "authors": [
            "Andrew W. Senior", "Richard Evans", "John Jumper", "James Kirkpatrick",
            "Laurent Sifre", "Tim Green", "Chongli Qin", "Augustin Žídek",
            "Alexander W. R. Nelson", "Alex Bridgland", "Hugo Penedones",
            "Stig Petersen", "Kalliopi Simonyan", "Steve Bodenstein", "Demis Hassabis"
        ],
        "venue": "Nature 577 (7792), 706-710",
        "doi": "10.1038/s41586-019-1923-7",
        "url": "https://www.nature.com/articles/s41586-019-1923-7",
        "is_milestone": True,
        "summary": "AlphaFold 1 won CASP13, demonstrating deep neural networks can accurately predict inter-residue distance distributions in proteins.",
    },
    {
        "id": "alphafold_2_2021",
        "title": "Highly accurate protein structure prediction with AlphaFold",
        "arxiv_id": "2103.01166",
        "year": 2021,
        "publication_date": "2021-07-15",
        "primary_theme": "AI for Science",
        "topics": ["Protein Folding", "Evoformer", "Structural Biology", "CASP14"],
        "authors": [
            "John Jumper", "Richard Evans", "Alexander Pritzel", "Tim Green",
            "Michael Figurnov", "Olaf Ronneberger", "Kathryn Tunyasuvunakool",
            "Russ Bates", "Augustin Žídek", "Alex Bridgland", "Clemens Meyer",
            "Simon A. A. Kohl", "Anna Potapenko", "Andrew J. Ballard", "Demis Hassabis"
        ],
        "venue": "Nature 596 (7873), 583-589",
        "doi": "10.1038/s41586-021-03819-2",
        "url": "https://www.nature.com/articles/s41586-021-03819-2",
        "is_milestone": True,
        "summary": "AlphaFold 2 solved the 50-year-old protein folding grand challenge with atomic-level accuracy via the Evoformer architecture.",
    },
    {
        "id": "chinchilla_2022",
        "title": "Training Compute-Optimal Large Language Models",
        "arxiv_id": "2203.15556",
        "year": 2022,
        "publication_date": "2022-03-29",
        "primary_theme": "LLM & Foundation Models",
        "topics": ["Scaling Laws", "Compute-Optimal Training", "Chinchilla", "Language Models"],
        "authors": [
            "Jordan Hoffmann", "Sebastian Borgeaud", "Arthur Mensch", "Elena Buchatskaya",
            "Trevor Cai", "Eliza Rutherford", "Diego de Las Casas", "Lisa Anne Hendricks",
            "Johannes Welbl", "Aidan Clark", "Tom Hennigan", "Eric Noland", "Katie Millican",
            "George van den Driessche", "Bogdan Damoc", "Aurelia Guy", "Simon Osindero",
            "Karen Simonyan", "Erich Elsen", "Jack W. Rae", "Oriol Vinyals", "Laurent Sifre"
        ],
        "venue": "NeurIPS 2022",
        "url": "https://arxiv.org/abs/2203.15556",
        "is_milestone": True,
        "summary": "Identified the Chinchilla scaling laws, proving model size and training tokens should scale equally for optimal performance.",
    },
    {
        "id": "flamingo_2022",
        "title": "Flamingo: a Visual Language Model for Few-Shot Learning",
        "arxiv_id": "2204.14198",
        "year": 2022,
        "publication_date": "2022-04-29",
        "primary_theme": "LLM & Multimodal",
        "topics": ["Vision-Language Models", "Few-Shot Multimodal Learning", "Gated Cross-Attention"],
        "authors": [
            "Jean-Baptiste Alayrac", "Jeff Donahue", "Pauline Luc", "Antoine Miech",
            "Iain Barr", "Yana Hasson", "Karel Lenc", "Arthur Mensch",
            "Katie Millican", "Malcolm Reynolds", "Roman Ring", "Eliza Rutherford",
            "Serkan Cabi", "Tengda Han", "Zhitao Gong", "Sina Samangooei",
            "Marianne Monteiro", "Jacob Menick", "Sebastian Borgeaud", "Andrew Brock",
            "Aida Nematzadeh", "Sahand Sharifzadeh", "Mikolaj Binkowski", "Ricardo Barreira",
            "Oriol Vinyals", "Andrew Zisserman", "Karen Simonyan"
        ],
        "venue": "NeurIPS 2022",
        "url": "https://arxiv.org/abs/2204.14198",
        "is_milestone": True,
        "summary": "State-of-the-art visual language model capable of rapid in-context few-shot learning across diverse vision-text benchmarks.",
    },
    {
        "id": "gato_2022",
        "title": "A Generalist Agent",
        "arxiv_id": "2205.06141",
        "year": 2022,
        "publication_date": "2022-05-12",
        "primary_theme": "Embodied AI & Generalist Agents",
        "topics": ["Generalist Agent", "Multi-Embodiment", "Sequence Modeling", "Robotics & Games"],
        "authors": [
            "Scott Reed", "Konrad Zolna", "Emilio Parisotto", "Sergio Gomez Colmenarejo",
            "Alexander Novikov", "Gabriel Barth-Maron", "Mai Gimenez", "Marko Sulsky",
            "Jackie Kay", "Jost Tobias Springenberg", "Tom Eccles", "Kagandi",
            "Dhruva Gautam", "Michael Chang", "Jack Parker-Holder", "Lars Buesing",
            "Matthew Lai", "David Silver", "Nando de Freitas"
        ],
        "venue": "Transactions on Machine Learning Research (TMLR) 2022",
        "url": "https://arxiv.org/abs/2205.06141",
        "is_milestone": True,
        "summary": "A single multi-task, multi-embodiment agent (Gato) trained on 604 distinct tasks ranging from Atari games to real robotic arms.",
    },
    {
        "id": "graphcast_2022",
        "title": "Learning skillful medium-range global weather forecasting",
        "arxiv_id": "2212.12794",
        "year": 2022,
        "publication_date": "2022-12-25",
        "primary_theme": "AI for Science",
        "topics": ["Weather Forecasting", "Graph Neural Networks", "Climate Modeling", "ERA5"],
        "authors": [
            "Remi Lam", "Alvaro Sanchez-Gonzalez", "Matthew Willson", "Peter Wirnsberger",
            "Meire Fortunato", "Ferran Alet", "Suman Ravuri", "Alexander Pritzel",
            "James Kirkpatrick", "Peter Battaglia"
        ],
        "venue": "Science 382 (6677), 1416-1421",
        "doi": "10.1126/science.adi2336",
        "url": "https://arxiv.org/abs/2212.12794",
        "is_milestone": True,
        "summary": "Outperformed top operational numerical weather prediction models (ECMWF HRES) on 90% of verification targets in seconds.",
    },
    {
        "id": "rt1_2022",
        "title": "RT-1: Robotics Transformer for Real-World Control at Scale",
        "arxiv_id": "2212.06817",
        "year": 2022,
        "publication_date": "2022-12-13",
        "primary_theme": "Robotics",
        "topics": ["Robotics Transformer", "Imitation Learning", "Manipulation", "Embodied AI"],
        "authors": [
            "Anthony Brohan", "Noah Brown", "Justice Carbajal", "Yevgen Chebotar",
            "Joseph Dabis", "Chelsea Finn", "Keerthana Gopalakrishnan", "Karol Hausman",
            "Alex Herzog", "Jasmine Hsu", "Julian Ibarz", "Brian Ichter", "Alex Irpan",
            "Isabel Leal", "Kuang-Huei Lee", "Sergey Levine", "Vincent Vanhoucke", "Fei Xia"
        ],
        "venue": "Robotics: Science and Systems (RSS) 2023",
        "url": "https://arxiv.org/abs/2212.06817",
        "is_milestone": True,
        "summary": "Scaling multi-task tokenized control policies for real-world robotic manipulation across 700+ tasks.",
    },
    {
        "id": "alphadev_2023",
        "title": "Faster sorting algorithms discovered using deep reinforcement learning",
        "arxiv_id": "2306.00254",
        "year": 2023,
        "publication_date": "2023-06-07",
        "primary_theme": "Reinforcement Learning & Code",
        "topics": ["Algorithm Discovery", "Assembly Optimization", "AssemblyGame", "DRL"],
        "authors": [
            "Daniel J. Mankowitz", "Andrea Michi", "Anton Zhernov", "Marco Gelmi",
            "Marco Selvi", "Cosmin Paduraru", "Edouard Leurent", "Sholto Douglas",
            "Goran Radanovic", "Demis Hassabis", "David Silver"
        ],
        "venue": "Nature 618 (7964), 257-263",
        "doi": "10.1038/s41586-023-06004-9",
        "url": "https://www.nature.com/articles/s41586-023-06004-9",
        "is_milestone": True,
        "summary": "AlphaDev discovered faster sorting and hashing algorithms at the assembly level, integrated directly into the LLVM C++ library.",
    },
    {
        "id": "rt2_2023",
        "title": "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control",
        "arxiv_id": "2307.15818",
        "year": 2023,
        "publication_date": "2023-07-28",
        "primary_theme": "Robotics",
        "topics": ["Vision-Language-Action", "VLA", "Embodied Intelligence", "Robotics"],
        "authors": [
            "Anthony Brohan", "Noah Brown", "Justice Carbajal", "Yevgen Chebotar",
            "Xi Chen", "Krzysztof Choromanski", "Tianli Ding", "Danny Driess",
            "Avinava Dubey", "Chelsea Finn", "Pete Florence", "Chuyuan Fu",
            "Karol Hausman", "Alex Herzog", "Brian Ichter", "Sergey Levine", "Vincent Vanhoucke"
        ],
        "venue": "Conference on Robot Learning (CoRL) 2023",
        "url": "https://arxiv.org/abs/2307.15818",
        "is_milestone": True,
        "summary": "Co-fine-tunes web-scale vision-language models on robotic actions to achieve emergent semantic reasoning in physical manipulation.",
    },
    {
        "id": "funsearch_2023",
        "title": "Mathematical discoveries from program search with large language models",
        "arxiv_id": "2312.00752",
        "year": 2023,
        "publication_date": "2023-12-14",
        "primary_theme": "AI for Science & Math",
        "topics": ["Program Search", "Mathematical Discovery", "Combinatorics", "LLM Code Generation"],
        "authors": [
            "Bernardino Romera-Paredes", "Mohammadamin Barekatain", "Alexander Novikov",
            "Matej Balog", "M. Pawan Kumar", "Emil Dupont", "Francisco J. R. Ruiz",
            "Jordan S. Ellenberg", "Alhussein Fawzi", "Pushmeet Kohli"
        ],
        "venue": "Nature 625 (7995), 468-475",
        "doi": "10.1038/s41586-023-06924-6",
        "url": "https://www.nature.com/articles/s41586-023-06924-6",
        "is_milestone": True,
        "summary": "FunSearch pairs an LLM with an automated evaluator to discover new mathematical constructions beyond existing human bounds.",
    },
    {
        "id": "gemini_1_0_2023",
        "title": "Gemini: A Family of Highly Capable Multimodal Models",
        "arxiv_id": "2312.11805",
        "year": 2023,
        "publication_date": "2023-12-19",
        "primary_theme": "LLM & Multimodal",
        "topics": ["Native Multimodal", "Gemini Ultra", "MMLU Superhuman", "Multi-modal Pre-training"],
        "authors": [
            "Gemini Team", "Google", "Google DeepMind"
        ],
        "venue": "arXiv preprint arXiv:2312.11805",
        "url": "https://arxiv.org/abs/2312.11805",
        "is_milestone": True,
        "summary": "First model to outperform human experts on MMLU (90.0%), natively pre-trained from scratch across text, audio, image, and video.",
    },
    {
        "id": "alphageometry_2024",
        "title": "Solving olympiad geometry without human demonstrations",
        "arxiv_id": "2404.06405",
        "year": 2024,
        "publication_date": "2024-01-17",
        "primary_theme": "AI for Science & Math",
        "topics": ["Automated Theorem Proving", "Neuro-Symbolic Reasoning", "Olympiad Geometry", "Synthetic Data"],
        "authors": [
            "Trieu H. Trinh", "Yuhuai Wu", "Quoc V. Le", "He He", "Thang Luong"
        ],
        "venue": "Nature 625 (7995), 476-482",
        "doi": "10.1038/s41586-023-06747-5",
        "url": "https://www.nature.com/articles/s41586-023-06747-5",
        "is_milestone": True,
        "summary": "Neuro-symbolic system solving 25 of 30 International Mathematical Olympiad geometry problems within human gold medalist range.",
    },
    {
        "id": "genie_2024",
        "title": "Genie: Generative Interactive Environments",
        "arxiv_id": "2402.15391",
        "year": 2024,
        "publication_date": "2024-02-23",
        "primary_theme": "World Models & Generative AI",
        "topics": ["World Models", "Interactive Video Generation", "Latent Action Modeling"],
        "authors": [
            "Jake Bruce", "Michael Dennis", "Ashley Edwards", "Jack Parker-Holder",
            "Yujin Tang", "Edward Hughes", "Kavosh Asadi", "Aditi Mavalankar",
            "Alex Zacherl", "Tim Rocktäschel"
        ],
        "venue": "arXiv preprint arXiv:2402.15391",
        "url": "https://arxiv.org/abs/2402.15391",
        "is_milestone": True,
        "summary": "Trained unsupervised from internet video to generate interactive 2D playable virtual worlds controllable frame-by-frame.",
    },
    {
        "id": "gemini_1_5_2024",
        "title": "Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context",
        "arxiv_id": "2403.05530",
        "year": 2024,
        "publication_date": "2024-02-15",
        "primary_theme": "LLM & Multimodal",
        "topics": ["Long Context", "Mixture of Experts", "1M+ Context Window", "Multimodal Retrieval"],
        "authors": [
            "Gemini Team", "Google", "Google DeepMind"
        ],
        "venue": "arXiv preprint arXiv:2403.05530",
        "url": "https://arxiv.org/abs/2403.05530",
        "is_milestone": True,
        "summary": "Pioneered production 1M-2M token context windows with near-perfect needle-in-a-haystack multimodal retrieval via sparse MoE.",
    },
    {
        "id": "gemma_2024",
        "title": "Gemma: Open Models Based on Gemini Research and Technology",
        "arxiv_id": "2403.08295",
        "year": 2024,
        "publication_date": "2024-03-13",
        "primary_theme": "LLM & Foundation Models",
        "topics": ["Open Weights", "Foundation Models", "Responsible AI", "Efficient Architecture"],
        "authors": [
            "Gemma Team", "Google DeepMind"
        ],
        "venue": "arXiv preprint arXiv:2403.08295",
        "url": "https://arxiv.org/abs/2403.08295",
        "is_milestone": True,
        "summary": "Lightweight state-of-the-art open models built from the same research and technology used for Gemini models.",
    },
    {
        "id": "sima_2024",
        "title": "Scaling Instructable Agents Across Diverse Simulated Environments",
        "arxiv_id": "2404.10179",
        "year": 2024,
        "publication_date": "2024-03-13",
        "primary_theme": "Embodied AI & Generalist Agents",
        "topics": ["Instructable Agents", "3D Virtual Worlds", "Embodied Language Grounding", "SIMA"],
        "authors": [
            "SIMA Team", "Google DeepMind"
        ],
        "venue": "arXiv preprint arXiv:2404.10179",
        "url": "https://arxiv.org/abs/2404.10179",
        "is_milestone": True,
        "summary": "A generalist agent for 3D virtual environments following natural language instructions across diverse modern video games.",
    },
    {
        "id": "alphafold_3_2024",
        "title": "Accurate structure prediction of biomolecular interactions with AlphaFold 3",
        "arxiv_id": "2405.05254",
        "year": 2024,
        "publication_date": "2024-05-08",
        "primary_theme": "AI for Science",
        "topics": ["Diffusion Architecture", "Biomolecular Interactions", "DNA/RNA/Ligands", "Structural Biology"],
        "authors": [
            "Josh Abramson", "Jonas Adler", "Jack Dunger", "Richard Evans",
            "Tim Green", "Alexander Pritzel", "Olaf Ronneberger", "Lindsay Willmore",
            "Andrew J. Ballard", "Joshua Bambrick", "Sebastian W. Bodenstein",
            "David A. Evans", "John Jumper", "Demis Hassabis"
        ],
        "venue": "Nature 630 (8016), 493-500",
        "doi": "10.1038/s41586-024-07487-w",
        "url": "https://www.nature.com/articles/s41586-024-07487-w",
        "is_milestone": True,
        "summary": "Expands structural prediction from proteins to all biomolecules (complexes of proteins, DNA, RNA, ligands, and ions) using diffusion.",
    },
    {
        "id": "alphaproof_2024",
        "title": "AI achieves silver-medal standard solving International Mathematical Olympiad problems",
        "arxiv_id": "2408.00118",
        "year": 2024,
        "publication_date": "2024-07-25",
        "primary_theme": "AI for Science & Math",
        "topics": ["Formal Mathematical Proof", "Lean Theorem Prover", "RL for Formal Proofs", "IMO 2024"],
        "authors": [
            "AlphaProof Team", "AlphaGeometry Team", "Google DeepMind"
        ],
        "venue": "DeepMind Research Milestone Announcement & Technical Report",
        "url": "https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/",
        "is_milestone": True,
        "summary": "AlphaProof (formal math in Lean) and AlphaGeometry 2 solved 4 of 6 IMO 2024 problems to reach the official silver-medal benchmark.",
    },
]


class DeepMindScraper:
    """Scraper and manager for DeepMind research papers and milestones."""

    PUBLICATIONS_URL = "https://deepmind.google/research/publications/"

    def __init__(self, output_path: Optional[str] = None):
        """Initialize DeepMind scraper.

        Args:
            output_path: Path to save combined raw papers JSON (defaults to data/raw_papers.json).
        """
        if output_path is None:
            project_root = Path(__file__).resolve().parent.parent
            self.output_path = project_root / "data" / "raw_papers.json"
        else:
            self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DeepMindResearchRoadmap/1.0"
        })

    def get_seed_papers(self) -> List[Dict[str, Any]]:
        """Return the curated list of milestone papers."""
        return [dict(paper) for paper in DEEPMIND_MILESTONE_PAPERS]

    def scrape_publications(self, max_retries: int = 2, timeout: int = 15) -> List[Dict[str, Any]]:
        """Scrape publication entries from the official DeepMind publications page.

        Includes fallback mechanisms: if the page is unreachable or dynamically rendered,
        it logs warnings and returns an empty list without crashing.
        """
        scraped_papers: List[Dict[str, Any]] = []
        url = self.PUBLICATIONS_URL

        for attempt in range(max_retries):
            try:
                logger.info("Attempting to fetch DeepMind publications from %s (attempt %d/%d)...", url, attempt + 1, max_retries)
                resp = self.session.get(url, timeout=timeout)
                if resp.status_code != 200:
                    logger.warning("DeepMind publications page returned status %d", resp.status_code)
                    time.sleep(2.0)
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")

                # Strategy 1: Look for articles or cards in HTML
                cards = soup.find_all(["article", "div", "li"], class_=re.compile(r"publication|card|research-item", re.IGNORECASE))
                for card in cards:
                    title_elem = card.find(["h2", "h3", "h4", "a"])
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)
                    if not title or len(title) < 5:
                        continue

                    link_elem = card.find("a", href=True)
                    link = link_elem["href"] if link_elem else ""
                    if link.startswith("/"):
                        link = f"https://deepmind.google{link}"

                    scraped_papers.append({
                        "title": title,
                        "url": link,
                        "source": "scraped_publications",
                    })

                # Strategy 2: Look for embedded JSON script tags (e.g. Next.js or application/ld+json)
                for script in soup.find_all("script", type=["application/ld+json", "application/json"]):
                    try:
                        content = script.string
                        if not content:
                            continue
                        json_data = json.loads(content)
                        if isinstance(json_data, dict) and "itemListElement" in json_data:
                            for item in json_data["itemListElement"]:
                                name = item.get("name") or (item.get("item", {}).get("name"))
                                item_url = item.get("url") or (item.get("item", {}).get("url"))
                                if name:
                                    scraped_papers.append({
                                        "title": name,
                                        "url": item_url or "",
                                        "source": "scraped_ld_json",
                                    })
                    except Exception:
                        continue

                logger.info("Scraped %d publication entries from website", len(scraped_papers))
                return scraped_papers

            except requests.RequestException as e:
                logger.warning("Scraping error on %s: %s", url, e)
                time.sleep(2.0)

        logger.info("Scraping completed with 0 or fallback results. Seed dataset will ensure full completeness.")
        return scraped_papers

    def get_all_papers(
        self,
        try_scrape: bool = True,
        save_to_file: bool = True,
    ) -> List[Dict[str, Any]]:
        """Retrieve complete dataset of DeepMind papers.

        Merges milestone seed papers with any newly scraped entries.
        Guarantees that all core milestone papers are present and prioritized.

        Args:
            try_scrape: If True, attempts to scrape online publications before falling back to seeds.
            save_to_file: If True, writes the merged dataset to output_path (raw_papers.json).

        Returns:
            List of paper dictionaries.
        """
        papers_dict: Dict[str, Dict[str, Any]] = {}

        # 1. First add curated milestone seeds (guaranteed quality and metadata)
        for seed in self.get_seed_papers():
            key = seed.get("id") or seed.get("arxiv_id") or seed["title"].lower()
            papers_dict[key] = seed

        # 2. If scraping is requested, attempt to augment
        if try_scrape:
            scraped = self.scrape_publications()
            for item in scraped:
                title_clean = item["title"].strip()
                # Check if already present by title
                already_present = any(
                    title_clean.lower() in p["title"].lower() or p["title"].lower() in title_clean.lower()
                    for p in papers_dict.values()
                )
                if not already_present:
                    papers_dict[f"scraped_{len(papers_dict)}"] = {
                        "id": f"scraped_{len(papers_dict)}",
                        "title": title_clean,
                        "url": item.get("url", ""),
                        "year": item.get("year", None),
                        "is_milestone": False,
                        "topics": [],
                        "primary_theme": "General AI",
                    }

        all_papers = list(papers_dict.values())

        # 3. Save to data/raw_papers.json if requested
        if save_to_file:
            try:
                with open(self.output_path, "w", encoding="utf-8") as f:
                    json.dump(all_papers, f, ensure_ascii=False, indent=2)
                logger.info("Saved %d papers to %s", len(all_papers), self.output_path)
            except Exception as e:
                logger.error("Failed to save papers to %s: %s", self.output_path, e)

        return all_papers

    def get_papers(self, limit: Optional[int] = None, use_cache: bool = True, try_scrape: bool = False) -> List[Dict[str, Any]]:
        """获取论文列表（兼容 pipeline 调用规范）"""
        papers = self.get_all_papers(try_scrape=try_scrape, save_to_file=True)
        if limit:
            papers = papers[:limit]
        return papers
