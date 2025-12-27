import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from 'src/entities/question.entity';
import { QuestionGroup } from 'src/entities/question-group.entity';
import { TagService } from 'src/tag/tag.service';
import { QuestionService } from 'src/question/question.service';
import { MiniTestResponse } from './dto/mini-test-response.dto';
import { MiniTestQuestionGroupResponse } from './dto/mini-test-question-group-response.dto';
import { MiniTestQuestionResponse } from './dto/mini-test-question-response.dto';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class MiniTestService {
  constructor(
    private readonly tagService: TagService,
    private readonly questionService: QuestionService,
  ) {}

  async getLearnerTestQuestionGroupResponsesByTags(
    partId: number,
    tagIds: Set<number>,
    numberQuestion: number,
  ): Promise<MiniTestResponse> {
    // Validate tags exist
    await this.tagService.checkExistsIds(tagIds);

    // Get all question groups with questions
    const groupEntities = await this.getAllQuestionGroup(
      partId,
      tagIds,
      numberQuestion,
    );

    // Sort questions by position within each group
    groupEntities.forEach((questions) => {
      questions.sort((a, b) => a.position - b.position);
    });

    const miniTestQuestionGroupResponses: MiniTestQuestionGroupResponse[] = [];
    let groupPosition = 1;
    let globalQuestionPosition = 1;

    for (const [questionGroup, questions] of groupEntities.entries()) {
      const groupResponse: MiniTestQuestionGroupResponse = {
        id: questionGroup.id,
        index: groupPosition++,
        position: questionGroup.position,
        audioUrl: questionGroup.audioUrl,
        imageUrl: questionGroup.imageUrl,
        passage: questionGroup.passage,
        questions: [],
      };

      const questionResponses: MiniTestQuestionResponse[] = [];
      for (const question of questions) {
        const questionResponse: MiniTestQuestionResponse = {
          id: question.id,
          position: question.position,
          index: globalQuestionPosition++,
          content: question.content,
          options: question.options,
          tags: question.tags.map((tag) => tag.name),
        };
        questionResponses.push(questionResponse);
      }
      groupResponse.questions = questionResponses;
      miniTestQuestionGroupResponses.push(groupResponse);
    }

    return {
      totalQuestions: globalQuestionPosition - 1,
      questionGroups: miniTestQuestionGroupResponses,
    };
  }

  private async getAllQuestionGroup(
    partId: number,
    tagIds: Set<number>,
    numberQuestion: number,
  ): Promise<Map<QuestionGroup, Question[]>> {
    // Get all questions by part and tags
    const allQuestions = await this.questionService.getAllQuestionsByPartAndTags(
      tagIds,
      partId,
    );

    // Shuffle questions
    this.shuffle(allQuestions);

    // Group questions by tag
    const questionsByTag = new Map<number, Question[]>();
    for (const tagId of tagIds) {
      const tagQuestions = allQuestions.filter((question) =>
        question.tags.some((tag) => tag.id === tagId),
      );
      questionsByTag.set(tagId, tagQuestions);
    }

    // Select questions evenly from each tag
    const selectedQuestions: Question[] = [];
    const usedQuestionIds = new Set<number>();
    const tagIndices = new Map<number, number>();
    tagIds.forEach((tagId) => tagIndices.set(tagId, 0));

    while (selectedQuestions.length < numberQuestion) {
      let addedInThisRound = false;

      for (const tagId of tagIds) {
        if (selectedQuestions.length >= numberQuestion) break;

        const tagQuestions = questionsByTag.get(tagId);
        if (!tagQuestions || tagQuestions.length === 0) {
          throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Question');
        }

        let currentIndex = tagIndices.get(tagId) || 0;

        while (currentIndex < tagQuestions.length) {
          const tagQuestion = tagQuestions[currentIndex];
          currentIndex++;

          if (!usedQuestionIds.has(tagQuestion.id)) {
            selectedQuestions.push(tagQuestion);
            usedQuestionIds.add(tagQuestion.id);
            addedInThisRound = true;
            break;
          }
        }

        tagIndices.set(tagId, currentIndex);
      }

      if (!addedInThisRound) break;
    }

    // Group selected questions by QuestionGroup
    const result = new Map<QuestionGroup, Question[]>();
    for (const question of selectedQuestions) {
      if (!result.has(question.questionGroup)) {
        result.set(question.questionGroup, []);
      }
      result.get(question.questionGroup)!.push(question);
    }

    return result;
  }

  private shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
