export const SYSTEM_PROMPT = `你是一个专业的求职助手AI，帮助用户管理求职进度、生成面试素材。

你具备以下能力：
1. 管理投递进展 - 添加、更新、查询求职投递状态
2. 分析JD匹配度 - 基于用户简历分析与职位的匹配程度
3. 生成自我介绍 - 根据目标职位生成1/3/5分钟的自我介绍
4. 生成面试题答案 - 基于STAR法则生成高质量面试回答
5. 面试复盘 - 帮助整理面试问题并生成标准答案

回答要求：
- 使用中文回答
- 简洁明了，重点突出
- 提供可操作的建议
- 在合适时主动推荐使用相关工具`

export const INTRO_GENERATION_PROMPT = `请根据以下信息，为候选人生成一段{duration}分钟的自我介绍。

目标职位：{jobTitle}
公司：{company}
职位要求：
{jobRequirements}

候选人简历：
{resumeContent}

相关项目经历：
{projectExperiences}

要求：
1. 开场简洁有力，包含姓名和目标岗位
2. 突出与职位最匹配的经验和技能
3. 用具体数据和成果说话
4. 结尾表达对职位的热情和期望
5. 时长控制在{duration}分钟左右（{wordCount}字左右）
6. 语言自然流畅，适合口语表达`

export const MATCH_ANALYSIS_PROMPT = `请分析候选人简历与职位描述的匹配程度。

职位描述：
{jobDescription}

候选人简历：
{resumeContent}

请从以下维度进行分析：
1. 技能匹配度（权重40%）
2. 经验匹配度（权重30%）
3. 行业背景匹配度（权重15%）
4. 教育背景匹配度（权重15%）

输出格式：
{
  "overallScore": 85,
  "dimensions": {
    "skills": { "score": 90, "matched": ["技能1", "技能2"], "missing": ["技能3"] },
    "experience": { "score": 80, "analysis": "分析说明" },
    "industry": { "score": 85, "analysis": "分析说明" },
    "education": { "score": 90, "analysis": "分析说明" }
  },
  "suggestions": ["建议1", "建议2"],
  "highlights": ["亮点1", "亮点2"]
}`

export const INTERVIEW_QUESTION_PROMPT = `请根据以下职位信息和候选人背景，生成可能的面试问题及参考答案。

职位信息：
{jobDescription}

候选人简历：
{resumeContent}

项目经历：
{projectExperiences}

请生成以下类型的问题：
1. 技术问题（3-5个）
2. 项目经历问题（2-3个，使用STAR法则回答）
3. 行为面试问题（2-3个）
4. 职业规划问题（1-2个）

对于每个问题，请提供：
- 问题本身
- 考察点
- 参考答案（基于候选人背景定制）
- 回答技巧`

export const STAR_ANSWER_PROMPT = `请使用STAR法则为以下面试问题生成答案。

面试问题：{question}

候选人相关经历：
{relevantExperience}

STAR法则要求：
- Situation（情境）：描述当时的背景和挑战
- Task（任务）：说明你的职责和目标
- Action（行动）：详细描述你采取的具体行动
- Result（结果）：量化的成果和收获

请生成一个结构清晰、具体有力的回答，时长控制在2-3分钟。`

export const REVIEW_SUMMARY_PROMPT = `请帮我总结这次面试的要点，并生成复盘报告。

面试信息：
公司：{company}
职位：{position}
面试轮次：{round}
面试时长：{duration}

面试问题和我的回答：
{questionsAndAnswers}

请生成：
1. 面试整体评估
2. 回答得好的地方
3. 需要改进的地方
4. 每个问题的标准答案参考
5. 下次面试的准备建议`

export const PARSE_APPLICATION_PROMPT = `请解析用户的自然语言输入，提取投递信息。

用户输入："{userInput}"

请识别并提取以下信息（如果存在）：
- 公司名称
- 职位名称
- 投递状态（pending/submitted/reviewing/interviewing/offer/rejected）
- 投递日期
- 其他备注

输出JSON格式：
{
  "company": "公司名",
  "position": "职位名",
  "status": "状态",
  "date": "日期",
  "notes": "备注",
  "action": "add|update|query"
}`
