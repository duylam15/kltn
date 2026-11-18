import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  Clock,
  Power,
  Send,
  History,
  AlertTriangle,
  FileText,
  ArrowLeft,
  HelpCircle,
  Trophy,
  Timer,
  RotateCcw,
  CalendarClock,
  Play,
  Info,
  CheckCircle2,
  FolderX,
  XCircle,
  FlaskConical,
  X,
} from "lucide-react";

dayjs.locale("vi");

type QuestionType = "multiple_choice" | "essay" | "coding" | "true_false";
type AssignmentType = "exercise" | "quiz" | "project" | "exam";

interface QuestionChoice {
  id: number;
  questionId: number;
  content: string;
  isCorrect: boolean;
  order: number;
}

interface TestCase {
  id: number;
  questionId: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  order: number;
}

interface TestResult {
  id: number;
  got: string;
  input: string;
  expect: string;
  status: "ok" | "wrong" | "error";
}

interface Question {
  id: number;
  type: QuestionType;
  content: string;
  explanation: string | null;
  points: number;
  order: number;
  choices: QuestionChoice[];
  testCases?: TestCase[];
}

interface Assignment {
  id: number;
  title: string;
  description: string | null;
  type: AssignmentType;
  dueDate: string | null;
  maxScore: number;
  timeLimit: number | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  allowLateSubmission: boolean;
  questions: Question[];
}

interface StudentAnswer {
  questionId: number;
  selectedChoices?: number[];
  essayAnswer?: string;
  codeAnswer?: string;
  language?: string;
}

interface CodeSubmissionResult {
  id: number;
  submissionId: number;
  questionId: number;
  codeAnswer: string;
  language: string;
  score: number;
  maxScore: number;
  judgeStatus: string;
  compileLog: string | null;
  stdoutLog: string | null;
  stderrLog: string | null;
  testResults: TestResult[];
}

type ModalVariant = "info" | "success" | "warning" | "danger";

interface DialogState {
  open: boolean;
  variant: ModalVariant;
  title: string;
  description?: string;
  highlights?: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

export default function AssignmentsDetailsStudent() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState(new Map());
  const [codeResults, setCodeResults] = useState<
    Map<number, CodeSubmissionResult>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testingCode, setTestingCode] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLateSubmission, setIsLateSubmission] = useState(false);

  // State quản lý Modal đẹp thay thế toàn bộ alert / window.confirm
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    variant: "info",
    title: "",
  });

  const closeDialog = () => {
    const callback = dialog.onClose;
    setDialog((prev) => ({ ...prev, open: false, onConfirm: undefined, onClose: undefined }));
    if (callback) callback();
  };

  const openAlertModal = (options: Omit<DialogState, "open">) => {
    setDialog({
      open: true,
      confirmText: "Đã hiểu",
      ...options,
    });
  };

  const openConfirmModal = (options: Omit<DialogState, "open">) => {
    setDialog({
      open: true,
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      ...options,
    });
  };

  const answersRef = useRef(answers);
  const submittingRef = useRef(submitting);

  const studentId = user?.student?.id;
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetails();
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!hasStarted || timeRemaining === null || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            if (!submittingRef.current) {
              handleAutoSubmit();
            }
          }, 100);
          return 0;
        }
        if (prev === 300) {
          openAlertModal({
            variant: "warning",
            title: "Còn 5 phút làm bài",
            description:
              "Thời gian làm bài chỉ còn 5 phút. Hãy rà soát lại các câu trả lời và chuẩn bị nộp bài.",
            confirmText: "Tiếp tục làm bài",
          });
        }
        if (prev === 60) {
          openAlertModal({
            variant: "danger",
            title: "Khẩn cấp: Còn 1 phút!",
            description:
              "Hệ thống sẽ tự động thu và nộp bài làm của bạn ngay khi đồng hồ đếm ngược kết thúc.",
            confirmText: "Tôi đã rõ",
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  const fetchAssignmentDetails = async () => {
    setLoading(true);
    try {
      const assignmentRes = await fetch(
        `http://localhost:4000/api/v1/assignments/${assignmentId}`,
        { credentials: "include" }
      );
      const assignmentData = await assignmentRes.json();

      if (!assignmentData.success) {
        setError("Không thể tải thông tin bài tập");
        setLoading(false);
        return;
      }

      const questionsRes = await fetch(
        `http://localhost:4000/api/v1/questions`,
        { credentials: "include" }
      );
      const questionsData = await questionsRes.json();

      if (!questionsData.success) {
        setError("Không thể tải danh sách câu hỏi");
        setLoading(false);
        return;
      }

      const assignmentQuestions = assignmentData.data.questions || [];
      const allQuestions = questionsData.data || [];

      const questionIds = assignmentQuestions.map((q: any) => q.questionId);
      const questionsMap = new Map(
        allQuestions.map((q: Question) => [q.id, q])
      );

      const fullQuestions: Question[] = questionIds
        .map((id: number) => questionsMap.get(id))
        .filter((q: any): q is Question => q !== undefined)
        .sort((a: any, b: any) => a.order - b.order);

      for (const question of fullQuestions) {
        if (question.type === "coding") {
          try {
            const testCasesRes = await fetch(
              `http://localhost:4000/api/v1/test-cases/question/${question.id}`,
              { credentials: "include" }
            );
            const testCasesData = await testCasesRes.json();
            if (testCasesData.success) {
              question.testCases = testCasesData.data || [];
            }
          } catch (err) {
            console.error(
              `Error fetching test cases for question ${question.id}:`,
              err
            );
          }
        }
      }

      const assignmentObj = {
        ...assignmentData.data,
        questions: fullQuestions,
      };
      setAssignment(assignmentObj);

      if (assignmentObj.dueDate) {
        const now = dayjs();
        const dueDate = dayjs(assignmentObj.dueDate);
        if (now.isAfter(dueDate)) {
          setIsLateSubmission(true);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartAssignment = async () => {
    if (isLateSubmission && !assignment?.allowLateSubmission) {
      openAlertModal({
        variant: "warning",
        title: "Không thể bắt đầu bài tập",
        description:
          "Bài tập đã quá hạn nộp và giảng viên không cho phép nộp muộn.",
      });
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/assignments/${assignmentId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            studentId: studentId,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setHasStarted(true);
        if (assignment?.timeLimit) {
          setTimeRemaining(assignment.timeLimit * 60);
        }
        if (assignment?.shuffleQuestions) {
          const shuffled = shuffleArray(assignment.questions);
          setDisplayQuestions(shuffled);
        } else {
          setDisplayQuestions(assignment?.questions || []);
        }
      } else {
        setError(data.message || "Không thể bắt đầu bài tập");
      }
    } catch (err) {
      console.error("Error starting assignment:", err);
      setError("Lỗi khi bắt đầu bài tập");
    }
  };

  const handleAnswerChange = (
    questionId: number,
    answer: Partial<StudentAnswer>
  ) => {
    setAnswers((prev) => {
      const newAnswers = new Map<number, StudentAnswer>(prev);
      const existingAnswer: StudentAnswer = newAnswers.get(questionId) || {
        questionId,
      };
      newAnswers.set(questionId, { ...existingAnswer, ...answer });
      return newAnswers;
    });
  };

  const handleMultipleChoiceChange = (
    questionId: number,
    choiceId: number,
    isMultiple: boolean
  ) => {
    const currentAnswer = answers.get(questionId);
    let selectedChoices: number[] = currentAnswer?.selectedChoices || [];

    if (isMultiple) {
      if (selectedChoices.includes(choiceId)) {
        selectedChoices = selectedChoices.filter((id) => id !== choiceId);
      } else {
        selectedChoices = [...selectedChoices, choiceId];
      }
    } else {
      selectedChoices = [choiceId];
    }

    handleAnswerChange(questionId, { selectedChoices });
  };

  const handleTestCode = async (questionId: number) => {
    const answer = answers.get(questionId);
    const language = answer?.language || "javascript";

    if (!answer?.codeAnswer?.trim()) {
      openAlertModal({
        variant: "warning",
        title: "Chưa có mã nguồn",
        description:
          "Vui lòng nhập đoạn code giải bài của bạn trước khi chạy kiểm thử (Test Code).",
      });
      return;
    }

    setTestingCode((prev) => new Set(prev).add(questionId));

    try {
      const submitRes = await fetch(
        `http://localhost:4000/api/v1/assignments/${assignmentId}/submit-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studentId: studentId,
            questionId: questionId,
            language,
            codeAnswer: answer.codeAnswer,
          }),
        }
      );

      const submitData = await submitRes.json();
      if (!submitData.success) {
        openAlertModal({
          variant: "danger",
          title: "Không thể gửi mã nguồn",
          description: submitData.message || "Đã xảy ra lỗi khi gửi code.",
        });
        return;
      }

      const answerId = submitData.data.answer?.id || submitData.data.id;
      if (!answerId) {
        openAlertModal({
          variant: "danger",
          title: "Lỗi dữ liệu phản hồi",
          description: "Không nhận được mã định danh bài làm từ hệ thống.",
        });
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = 500;

      const pollResult = async (): Promise<any> => {
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error("Quá thời gian chờ hệ thống chấm bài (30 giây).");
        }

        const resultRes = await fetch(
          `http://localhost:4000/api/v1/assignments/answer/${answerId}/status`,
          { credentials: "include" }
        );
        const resultData = await resultRes.json();

        if (!resultData.success) {
          throw new Error(resultData.message || "Không lấy được kết quả");
        }

        const status = resultData.data.judgeStatus;

        if (status === "queued" || status === "judging") {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          return pollResult();
        }

        if (status === "error") {
          throw new Error(
            resultData.data.stderrLog ||
              resultData.data.compileLog ||
              "Lỗi biên dịch hoặc thực thi chương trình"
          );
        }

        return resultData.data;
      };

      const result = await pollResult();

      setCodeResults((prev) => {
        const newResults = new Map(prev);
        newResults.set(questionId, result);
        return newResults;
      });

      const score = result.score ?? 0;
      const maxScore = result.maxScore ?? 0;
      const testResults = result.testResults || [];
      const passedCount = testResults.filter(
        (t: any) => t.status === "ok" || t.isPassed
      ).length;
      const isPerfect = score === maxScore && maxScore > 0;

      openAlertModal({
        variant: isPerfect ? "success" : "info",
        title: "Chạy kiểm thử hoàn tất",
        description: isPerfect
          ? "Xuất sắc! Mã nguồn của bạn đã vượt qua toàn bộ các bộ kiểm thử."
          : "Một số test case chưa đạt yêu cầu. Hãy kiểm tra chi tiết bên dưới khung soạn thảo.",
        highlights: [
          { label: "Điểm đạt được", value: `${score} / ${maxScore} điểm` },
          {
            label: "Test cases vượt qua",
            value: `${passedCount} / ${testResults.length}`,
          },
        ],
        confirmText: "Đóng",
      });
    } catch (err: any) {
      openAlertModal({
        variant: "danger",
        title: "Lỗi khi chạy Test Code",
        description: err.message || "Không thể thực thi mã nguồn của bạn.",
      });
    } finally {
      setTestingCode((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const executeSubmit = async (isAutoSubmit: boolean) => {
    if (submitting) return;
    const currentAnswers = answersRef.current;
    const answersArray = Array.from(currentAnswers.values());

    setSubmitting(true);
    try {
      const payload = {
        studentId,
        answers: answersArray,
      };

      const res = await fetch(
        `http://localhost:4000/api/v1/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("Không đọc được phản hồi từ server");
      }

      if (!res.ok) {
        throw new Error(data?.message || `Lỗi HTTP ${res.status}`);
      }

      if (data.success) {
        const goNext = () => {
          if (assignment?.showAnswersAfterSubmit) {
            navigate(
              `/student/courses/${sectionId}/assignments/${assignmentId}/score`,
              {
                state: {
                  ...data.data,
                  showAnswersAfterSubmit: true,
                },
              }
            );
          } else {
            navigate(`/student/courses/${sectionId}/assignments`);
          }
        };

        openAlertModal({
          variant: "success",
          title: isAutoSubmit
            ? "Đã tự động nộp bài do hết giờ"
            : "Nộp bài thành công!",
          description: assignment?.showAnswersAfterSubmit
            ? "Hệ thống đã ghi nhận bài làm của bạn. Nhấn tiếp tục để xem chi tiết điểm và đáp án."
            : "Hệ thống đã ghi nhận bài làm của bạn thành công.",
          highlights: [
            {
              label: "Số câu đã hoàn thành",
              value: `${answersArray.length} / ${displayQuestions.length} câu`,
            },
          ],
          confirmText: assignment?.showAnswersAfterSubmit
            ? "Xem kết quả ngay"
            : "Về danh sách bài tập",
          onConfirm: goNext,
          onClose: goNext,
        });
      } else {
        throw new Error(data?.message || "Nộp bài thất bại");
      }
    } catch (err: any) {
      const msg = err?.message || "Lỗi khi nộp bài";
      setError(msg);
      openAlertModal({
        variant: "danger",
        title: "Nộp bài thất bại",
        description: msg,
        onClose: isAutoSubmit
          ? () => navigate(`/student/courses/${sectionId}/assignments`)
          : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (isAutoSubmit: boolean = false) => {
    if (submitting) return;

    if (!isAutoSubmit && isLateSubmission && !assignment?.allowLateSubmission) {
      openAlertModal({
        variant: "warning",
        title: "Đã quá hạn nộp bài",
        description:
          "Bài tập đã hết hạn nộp và không cho phép nộp muộn.",
      });
      return;
    }

    if (isAutoSubmit) {
      executeSubmit(true);
      return;
    }

    const currentAnswers = answersRef.current;
    const unansweredQuestions = displayQuestions.filter(
      (q) => !currentAnswers.has(q.id)
    );

    if (unansweredQuestions.length > 0) {
      openConfirmModal({
        variant: "warning",
        title: "Xác nhận nộp bài",
        description: `Bạn vẫn còn ${unansweredQuestions.length} câu hỏi chưa trả lời. Sau khi nộp bài, bạn sẽ không thể chỉnh sửa lại đáp án.`,
        highlights: [
          {
            label: "Tiến độ hiện tại",
            value: `${currentAnswers.size} / ${displayQuestions.length} câu đã làm`,
          },
        ],
        confirmText: "Vẫn nộp bài",
        cancelText: "Quay lại làm tiếp",
        onConfirm: () => executeSubmit(false),
      });
    } else {
      openConfirmModal({
        variant: "info",
        title: "Hoàn tất & Nộp bài?",
        description:
          "Bạn đã trả lời đầy đủ tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?",
        highlights: [
          {
            label: "Số câu đã làm",
            value: `${currentAnswers.size} / ${displayQuestions.length} câu`,
          },
        ],
        confirmText: "Nộp bài ngay",
        cancelText: "Kiểm tra lại",
        onConfirm: () => executeSubmit(false),
      });
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const handleExit = () => {
    if (hasStarted) {
      openConfirmModal({
        variant: "danger",
        title: "Thoát khỏi bài làm?",
        description:
          "Nếu thoát ngay bây giờ, toàn bộ câu trả lời hiện tại sẽ không được lưu và lượt làm bài này vẫn có thể được tính.",
        confirmText: "Thoát bài làm",
        cancelText: "Ở lại tiếp tục",
        onConfirm: () => navigate(`/student/courses/${sectionId}/assignments`),
      });
      return;
    }
    navigate(`/student/courses/${sectionId}/assignments`);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredCount = () => {
    return answers.size;
  };

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const renderTestResults = (questionId: number) => {
    const result = codeResults.get(questionId);
    if (!result) return null;

    return (
      <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900 text-sm">
            Kết quả kiểm thử (Test Cases)
          </h4>
          <span
            className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${
              result.score === result.maxScore
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {result.score} / {result.maxScore} điểm
          </span>
        </div>

        {result.testResults && result.testResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.testResults.map((test, index) => (
              <div
                key={test.id || index}
                className={`p-2.5 rounded-lg text-xs font-medium flex justify-between items-center border ${
                  test.status === "ok"
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                    : "bg-rose-50/70 border-rose-200 text-rose-800"
                }`}
              >
                <span>Test case #{index + 1}</span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  {test.status === "ok" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Passed
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Failed
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers.get(question.id);
    const isTesting = testingCode.has(question.id);
    const isAnswered = answers.has(question.id);

    return (
      <div
        key={question.id}
        id={`question-${index}`}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 scroll-mt-24"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            <span className="text-blue-600 mr-1.5">Câu {index + 1}.</span>
            {question.content}
          </h3>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            {question.points} điểm
          </span>
        </div>

        <div>
          {question.type === "multiple_choice" && question.choices && (
            <div className="space-y-2.5">
              {question.choices
                .sort((a, b) => a.order - b.order)
                .map((choice, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected =
                    answer?.selectedChoices?.includes(choice.id) || false;
                  const hasMultipleCorrect =
                    question.choices!.filter((c) => c.isCorrect).length > 1;

                  return (
                    <label
                      key={choice.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-400"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <input
                          type={hasMultipleCorrect ? "checkbox" : "radio"}
                          name={`question-${question.id}`}
                          checked={isSelected}
                          onChange={() =>
                            handleMultipleChoiceChange(
                              question.id,
                              choice.id,
                              hasMultipleCorrect
                            )
                          }
                          disabled={!hasStarted}
                          className="hidden"
                        />
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-white text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-sm">
                        <span className="font-bold text-slate-900 mr-2">
                          {label}.
                        </span>
                        <span className="text-slate-700">{choice.content}</span>
                      </div>
                    </label>
                  );
                })}
            </div>
          )}

          {question.type === "true_false" && (
            <div className="space-y-2.5">
              {[
                { id: 1, content: "Đúng", value: true },
                { id: 2, content: "Sai", value: false },
              ].map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isSelected =
                  answer?.selectedChoices?.includes(option.id) || false;

                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={isSelected}
                        onChange={() =>
                          handleAnswerChange(question.id, {
                            selectedChoices: [option.id],
                          })
                        }
                        disabled={!hasStarted}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-bold text-slate-900 mr-2">
                        {label}.
                      </span>
                      <span className="text-slate-700">{option.content}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === "essay" && (
            <div>
              <textarea
                value={answer?.essayAnswer || ""}
                onChange={(e) =>
                  handleAnswerChange(question.id, {
                    essayAnswer: e.target.value,
                  })
                }
                placeholder="Nhập câu trả lời tự luận của bạn..."
                className="w-full min-h-[180px] p-4 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                disabled={!hasStarted}
              />
              <p className="text-xs text-slate-400 mt-1.5 text-right">
                {answer?.essayAnswer?.length || 0} ký tự
              </p>
            </div>
          )}

          {question.type === "coding" && (
            <div>
              <div className="mb-3 flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                <select
                  value={answer?.language || "javascript"}
                  onChange={(e) =>
                    handleAnswerChange(question.id, {
                      language: e.target.value,
                    })
                  }
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                  disabled={!hasStarted}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="html">HTML</option>
                  <option value="csharp">C#</option>
                  <option value="php">PHP</option>
                </select>
                <button
                  onClick={() => {
                    if (!answer?.language) {
                      handleAnswerChange(question.id, { language: "javascript" });
                    }
                    handleTestCode(question.id);
                  }}
                  disabled={!hasStarted || isTesting || !answer?.codeAnswer}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  {isTesting ? "Đang chạy thử..." : "Chạy Test Code"}
                </button>
              </div>
              <textarea
                value={answer?.codeAnswer || ""}
                onChange={(e) =>
                  handleAnswerChange(question.id, {
                    language: answer?.language || "javascript",
                    codeAnswer: e.target.value,
                  })
                }
                placeholder="// Nhập mã nguồn của bạn tại đây..."
                className="w-full min-h-[280px] p-4 border border-slate-800 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-900 text-emerald-400"
                disabled={!hasStarted}
                spellCheck={false}
              />
              {renderTestResults(question.id)}
            </div>
          )}
        </div>

        {isAnswered &&
          (question.type === "multiple_choice" ||
            question.type === "true_false") && (
            <div className="mt-4 px-3.5 py-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2 text-xs text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Đã chọn đáp án:{" "}
                <strong className="font-bold">
                  {answer?.selectedChoices
                    ?.map((id) => {
                      if (question.type === "true_false") {
                        return id === 1 ? "A" : "B";
                      }
                      const idx = question.choices
                        ?.sort((a, b) => a.order - b.order)
                        .findIndex((c) => c.id === id);
                      return idx !== undefined && idx >= 0
                        ? String.fromCharCode(65 + idx)
                        : "";
                    })
                    .join(", ")}
                </strong>
              </span>
            </div>
          )}
      </div>
    );
  };

  // =========================================================================
  // COMPONENT MODAL THÔNG BÁO / XÁC NHẬN ĐẸP (THAY THẾ ALERT & CONFIRM)
  // =========================================================================
  const renderCustomDialog = () => {
    if (!dialog.open) return null;

    const variantStyles: Record<
      ModalVariant,
      {
        icon: React.ReactNode;
        iconBg: string;
        btnBg: string;
      }
    > = {
      success: {
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
        iconBg: "bg-emerald-50 border-emerald-100",
        btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
      },
      warning: {
        icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
        iconBg: "bg-amber-50 border-amber-100",
        btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
      },
      danger: {
        icon: <XCircle className="w-6 h-6 text-rose-600" />,
        iconBg: "bg-rose-50 border-rose-100",
        btnBg: "bg-rose-600 hover:bg-rose-700 text-white",
      },
      info: {
        icon: <Info className="w-6 h-6 text-blue-600" />,
        iconBg: "bg-blue-50 border-blue-100",
        btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
      },
    };

    const currentStyle = variantStyles[dialog.variant];

    return (
      <div
        onClick={closeDialog}
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform transition-all"
        >
          {/* Top close button */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${currentStyle.iconBg}`}
                >
                  {currentStyle.icon}
                </div>
                <div className="pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {dialog.title}
                  </h3>
                  {dialog.description && (
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                      {dialog.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeDialog}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlights Box (Điểm số, số câu đã làm...) */}
            {dialog.highlights && dialog.highlights.length > 0 && (
              <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                {dialog.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-500 font-medium">
                      {item.label}
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {dialog.cancelText && (
              <button
                onClick={closeDialog}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                {dialog.cancelText}
              </button>
            )}
            <button
              onClick={() => {
                const action = dialog.onConfirm;
                setDialog((prev) => ({
                  ...prev,
                  open: false,
                  onConfirm: undefined,
                  onClose: undefined,
                }));
                if (action) action();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer ${currentStyle.btnBg}`}
            >
              {dialog.confirmText || "Đồng ý"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            Đang tải bài tập...
          </p>
        </div>
      </div>
    );
  }

  if (!assignment || !assignment.questions || assignment.questions.length === 0) {
    return (
      <div className="w-full px-6 py-6">
        {renderCustomDialog()}
        <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <FolderX className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            Không tìm thấy bài tập
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Bài tập này chưa có câu hỏi hoặc không tồn tại trên hệ thống.
          </p>
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH BẮT ĐẦU LÀM BÀI
  // =========================================================================
  if (!hasStarted) {
    const isBlocked = isLateSubmission && !assignment.allowLateSubmission;

    return (
      <div className="w-full px-6 py-6">
        {renderCustomDialog()}
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách bài tập</span>
            </button>

            {assignment.dueDate && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${
                  isLateSubmission
                    ? "bg-rose-50 text-rose-700 border-rose-200/80"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Hạn nộp:{" "}
                {dayjs(assignment.dueDate).format("DD/MM/YYYY • HH:mm")}
              </span>
            )}
          </div>

          <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-1">
                    Thông tin bài làm
                  </span>
                  <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                    {assignment.title}
                  </h1>
                  {assignment.description ? (
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {assignment.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic mt-1">
                      Không có mô tả bổ sung cho bài tập này.
                    </p>
                  )}
                </div>
              </div>

              {isBlocked && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bài tập đã hết hạn nộp</p>
                    <p className="mt-0.5 opacity-90">
                      Thời hạn nộp bài đã kết thúc vào{" "}
                      {dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")} và
                      không cho phép nộp muộn.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Lưu ý trước khi bắt đầu</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Thời gian bắt đầu tính ngay sau khi bạn nhấn nút{" "}
                      <strong className="font-medium text-slate-800">
                        Bắt đầu làm bài
                      </strong>
                      .
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Hệ thống sẽ tự động thu bài khi đồng hồ đếm ngược kết
                      thúc.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Không tải lại trang hoặc thoát khỏi trình duyệt trong quá
                      trình làm bài.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 leading-none">
                      {assignment.questions.length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Câu hỏi</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 leading-none">
                      {assignment.maxScore}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Tổng điểm</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 leading-none">
                      {assignment.timeLimit
                        ? `${assignment.timeLimit} phút`
                        : "Không giới hạn"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Thời gian</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 leading-none">
                      {assignment.maxAttempts} lần
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Số lượt làm
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleStartAssignment}
                  disabled={isBlocked}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Bắt đầu làm bài</span>
                </button>

                <Link
                  to={`/student/courses/${sectionId}/assignments/${assignmentId}/history`}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200 font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Xem lịch sử nộp bài</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN ĐANG LÀM BÀI
  // =========================================================================
  return (
    <div className="w-full min-h-screen bg-slate-100/80 flex flex-col">
      {renderCustomDialog()}

      {isLateSubmission && assignment.allowLateSubmission && (
        <div className="bg-rose-600 text-white px-6 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            CẢNH BÁO: Bạn đang làm bài quá hạn! Hạn nộp đã qua vào{" "}
            {dayjs(assignment.dueDate).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      )}

      {/* Top Sticky Header */}
      <div className="bg-white border-b border-slate-200 shadow-2xs sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleExit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>Thoát</span>
            </button>

            <div className="flex-1 text-center px-2 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {assignment.title}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                Thí sinh: {user?.fullName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {timeRemaining !== null && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base sm:text-lg font-bold border ${
                    timeRemaining < 300
                      ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}

              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors disabled:bg-slate-400 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Đang nộp..." : "Nộp bài"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-5 overflow-y-auto lg:max-h-[calc(100vh-130px)] pr-1">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-rose-700 text-sm font-medium">
                  {error}
                </span>
              </div>
            )}

            {displayQuestions.map((question, index) =>
              renderQuestion(question, index)
            )}
          </div>

          {/* Question Navigator Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sticky top-24">
              <h3 className="font-bold text-slate-900 text-center mb-4 text-sm">
                Danh sách câu hỏi
              </h3>

              <div className="grid grid-cols-5 gap-2 mb-5">
                {displayQuestions.map((question, index) => {
                  const isAnswered = answers.has(question.id);
                  return (
                    <button
                      key={question.id}
                      onClick={() => scrollToQuestion(index)}
                      className={`aspect-square flex items-center justify-center rounded-xl font-bold text-xs border transition-all hover:scale-105 cursor-pointer ${
                        isAnswered
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">Tiến độ hoàn thành</span>
                  <span className="font-bold text-blue-600">
                    {getAnsweredCount()} / {displayQuestions.length}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (getAnsweredCount() / displayQuestions.length) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-center text-xs font-bold text-blue-600 mt-1.5">
                  {Math.round(
                    (getAnsweredCount() / displayQuestions.length) * 100
                  )}
                  %
                </div>
              </div>

              <div className="mt-5 space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 bg-blue-600 rounded-md" />
                  <span className="text-slate-600">Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 bg-white border border-slate-300 rounded-md" />
                  <span className="text-slate-600">Chưa trả lời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}