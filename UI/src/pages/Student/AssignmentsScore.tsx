import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  FileText,
  Code2,
  ClipboardCheck,
  CheckSquare,
  Home,
  Loader2,
  Trophy,
  Target,
  Clock,
  ShieldAlert,
  Sparkles,
  Check,
  X,
} from "lucide-react";

dayjs.locale("vi");

export default function AssignmentsScore() {
  const { state } = useLocation() as { state: any };
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const path = window.location.pathname;
  const sectionId = Number(path.split("/")[3]);

  const [recommendation, setRecommendation] = useState<any>(null);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [recommendError, setRecommendError] = useState("");

  // Lưu map questionId -> danh sách choices lấy từ GET /api/v1/questions/:id
  const [choicesMap, setChoicesMap] = useState<Record<number, any[]>>({});
  const [loadingChoices, setLoadingChoices] = useState(false);

  const submission = state?.submission;
  const summary = state?.summary || {};
  const answers: any[] = state?.answers || [];
  const showAnswersAfterSubmit = state?.showAnswersAfterSubmit;

  // Gọi API GET /api/v1/questions/:id để lấy danh sách choices cho từng câu trắc nghiệm
  useEffect(() => {
    if (!answers.length || showAnswersAfterSubmit === false) return;

    const choiceQuestionIds = Array.from(
      new Set(
        answers
          .filter(
            (ans: any) =>
              (ans.questionType === "multiple_choice" ||
                ans.questionType === "true_false") &&
              ans.questionId
          )
          .map((ans: any) => Number(ans.questionId))
      )
    );

    if (choiceQuestionIds.length === 0) return;

    let isMounted = true;
    const fetchQuestionChoices = async () => {
      setLoadingChoices(true);
      try {
        const results = await Promise.all(
          choiceQuestionIds.map(async (qId) => {
            const res = await fetch(
              `http://localhost:4000/api/v1/questions/${qId}`,
              {
                method: "GET",
                credentials: "include",
              }
            );
            const json = await res.json();
            const questionData = json?.data || json;
            return {
              questionId: qId,
              choices: questionData?.choices || [],
            };
          })
        );

        if (isMounted) {
          const map: Record<number, any[]> = {};
          results.forEach((item) => {
            map[item.questionId] = item.choices;
          });
          setChoicesMap(map);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết lựa chọn câu hỏi:", error);
      } finally {
        if (isMounted) setLoadingChoices(false);
      }
    };

    fetchQuestionChoices();
    return () => {
      isMounted = false;
    };
  }, [answers, showAnswersAfterSubmit]);

  // Tính toán chính xác số câu đúng / sai (tránh lỗi NaN)
  const stats = useMemo(() => {
    const total = Number(summary.totalQuestions ?? answers.length ?? 0);
    const correct = Number(
      summary.correctAnswers ??
        summary.correctCount ??
        answers.filter((a: any) => a.isCorrect === true).length
    );
    const wrong = Math.max(0, total - correct);
    const percentage =
      summary.percentage ??
      (total > 0 ? Math.round((correct / total) * 100) : 0);
    return { total, correct, wrong, percentage };
  }, [summary, answers]);

  // 1. Không có dữ liệu state
  if (!state || !submission) {
    return (
      <div className="w-full px-6 py-12 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            Không tìm thấy dữ liệu kết quả
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Phiên xem kết quả đã hết hạn hoặc dữ liệu bài nộp không tồn tại trên hệ thống.
          </p>
          <button
            onClick={() =>
              navigate(`/student/courses/${sectionId}/assignments`)
            }
            className="w-full py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  // 2. Giảng viên tắt chế độ xem đáp án
  if (showAnswersAfterSubmit === false) {
    const maxScore = submission.maxScore || 10;
    return (
      <div className="w-full px-6 py-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 max-w-xl w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Nộp bài thành công!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hệ thống đã ghi nhận bài làm của bạn lúc{" "}
              <span className="font-medium text-slate-700">
                {dayjs(submission.submittedAt).format("HH:mm • DD/MM/YYYY")}
              </span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center shadow-xs">
            <p className="text-xs uppercase tracking-wider font-semibold text-blue-100 mb-1">
              Điểm số đạt được
            </p>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {submission.score}
              <span className="text-2xl font-semibold text-blue-200">
                /{maxScore}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Chế độ xem chi tiết đáp án đang tắt
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Giảng viên không mở hiển thị đáp án chi tiết sau khi nộp bài. Bạn có thể xem lại điểm tổng kết ở trên.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              navigate(`/student/courses/${sectionId}/assignments`)
            }
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  // Hàm render nội dung đáp án đã chọn và đáp án đúng
  const renderChoiceDetails = (ans: any) => {
    const rawChoices: any[] =
      choicesMap[Number(ans.questionId)] || ans.choices || [];

    // Bổ sung fallback cho dạng Đúng/Sai nếu API không lưu choices trong DB
    const allChoices =
      rawChoices.length > 0
        ? [...rawChoices].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : ans.questionType === "true_false"
        ? [
            { id: 1, content: "Đúng", isCorrect: false },
            { id: 2, content: "Sai", isCorrect: false },
          ]
        : [];

    const selectedIds: number[] = Array.isArray(ans.selectedChoices)
      ? ans.selectedChoices.map(Number)
      : [];

    const selectedOptions = allChoices.filter((c) =>
      selectedIds.includes(Number(c.id))
    );
    const correctOptions = allChoices.filter((c) => c.isCorrect === true);

    if (loadingChoices && rawChoices.length === 0) {
      return (
        <p className="text-xs text-slate-500 flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Đang tải nội dung đáp án...
        </p>
      );
    }

    return (
      <div className="space-y-3.5">
        {/* Đáp án sinh viên chọn */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Câu trả lời của bạn
          </p>
          {selectedIds.length === 0 ? (
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs italic text-slate-500">
              Bạn chưa chọn đáp án cho câu hỏi này
            </div>
          ) : selectedOptions.length > 0 ? (
            <div className="space-y-2">
              {selectedOptions.map((opt: any) => {
                const optIdx = allChoices.findIndex(
                  (c) => Number(c.id) === Number(opt.id)
                );
                const letter =
                  optIdx >= 0 ? `${String.fromCharCode(65 + optIdx)}. ` : "";

                return (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-2.5 text-sm px-3.5 py-2.5 rounded-xl border ${
                      ans.isCorrect
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium"
                        : "bg-rose-50/80 border-rose-200 text-rose-900 font-medium"
                    }`}
                  >
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>
                      <strong className="font-bold">{letter}</strong>
                      {opt.content}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedIds.map((choiceId: number) => (
                <div
                  key={choiceId}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800"
                >
                  Lựa chọn #{choiceId}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nếu làm SAI -> Hiện kèm đáp án đúng */}
        {!ans.isCorrect && correctOptions.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đáp án đúng
            </p>
            <div className="space-y-2">
              {correctOptions.map((opt: any) => {
                const optIdx = allChoices.findIndex(
                  (c) => Number(c.id) === Number(opt.id)
                );
                const letter =
                  optIdx >= 0 ? `${String.fromCharCode(65 + optIdx)}. ` : "";

                return (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2.5 text-sm px-3.5 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="font-bold">{letter}</strong>
                      {opt.content}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Gọi API recommend-path
  const handleRecommendPath = async () => {
    setLoadingRecommend(true);
    setRecommendError("");
    try {
      const res = await fetch(
        `http://localhost:4000/api/v1/assignments/${assignmentId}/recommend-path`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studentId: submission.studentId,
            score: submission.score,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setRecommendation(data);
      } else {
        setRecommendError(data.message || "Không thể gợi ý lộ trình học");
      }
    } catch (err) {
      console.error("Error recommending path:", err);
      setRecommendError("Lỗi kết nối khi gọi gợi ý lộ trình học");
    } finally {
      setLoadingRecommend(false);
    }
  };

  const maxScore = submission.maxScore || 10;

  // 3. Hiển thị đầy đủ kết quả
  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar & Score Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Kết quả bài làm
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết điểm số và đối chiếu đáp án từng câu hỏi
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/student/courses/${sectionId}/assignments`)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Danh sách bài tập</span>
            </button>
          </div>

          {/* Score Hero & Stats */}
          <div className="p-6 space-y-5">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-7 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-xs border ${
                    submission.isPassing
                      ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-200"
                      : "bg-rose-400/20 border-rose-300/40 text-rose-200"
                  }`}
                >
                  {submission.isPassing ? (
                    <CheckCircle2 className="w-9 h-9" />
                  ) : (
                    <XCircle className="w-9 h-9" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                      Tổng điểm đạt được
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        submission.isPassing
                          ? "bg-emerald-400/25 text-emerald-100 border border-emerald-300/30"
                          : "bg-rose-400/25 text-rose-100 border border-rose-300/30"
                      }`}
                    >
                      {submission.isPassing ? "Đạt yêu cầu" : "Chưa đạt"}
                    </span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {submission.score}
                    <span className="text-2xl font-semibold text-blue-200">
                      /{maxScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Progress Summary */}
              <div className="w-full sm:w-56 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-blue-100">
                  <span>Tỉ lệ chính xác</span>
                  <span className="text-sm font-bold text-white">
                    {stats.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-blue-100/90 text-right">
                  {stats.correct}/{stats.total} câu trả lời đúng
                </p>
              </div>
            </div>

            {/* 3 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Số câu đúng
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 leading-tight">
                    {stats.correct}
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Số câu sai
                  </p>
                  <p className="text-2xl font-bold text-rose-700 leading-tight">
                    {stats.wrong}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Thời gian nộp bài
                  </p>
                  <p className="text-base font-bold text-slate-900 leading-tight">
                    {dayjs(submission.submittedAt).format("HH:mm")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dayjs(submission.submittedAt).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>
            </div>

            {/* Lỗi hoặc Kết quả Gợi ý lộ trình học */}
            {recommendError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{recommendError}</span>
              </div>
            )}

            {recommendation && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <p className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Đánh giá năng lực: {recommendation.label}
                </p>
                <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-800 pl-1">
                  {recommendation.suggestions?.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Chi tiết từng câu */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <span>Chi tiết từng câu hỏi ({answers.length} câu)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {answers.map((ans: any, idx: number) => {
              const isEssayPending =
                ans.questionType === "essay" &&
                (ans.score === null || ans.score === undefined);

              return (
                <div
                  key={ans.answerId || idx}
                  className={`bg-white rounded-2xl border shadow-2xs overflow-hidden ${
                    isEssayPending
                      ? "border-slate-200"
                      : ans.isCorrect
                      ? "border-emerald-200/90"
                      : "border-rose-200/90"
                  }`}
                >
                  {/* Card Top Header */}
                  <div
                    className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
                      isEssayPending
                        ? "bg-slate-50/70 border-slate-100"
                        : ans.isCorrect
                        ? "bg-emerald-50/40 border-emerald-100"
                        : "bg-rose-50/40 border-rose-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isEssayPending
                            ? "bg-slate-200 text-slate-700"
                            : ans.isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
                        {ans.questionType === "multiple_choice" && (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                            Trắc nghiệm
                          </>
                        )}
                        {ans.questionType === "essay" && (
                          <>
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            Tự luận
                          </>
                        )}
                        {ans.questionType === "coding" && (
                          <>
                            <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                            Lập trình
                          </>
                        )}
                        {ans.questionType === "true_false" && (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            Đúng / Sai
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEssayPending ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ giảng viên chấm · Tối đa {ans.maxScore} điểm
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                            ans.isCorrect
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {ans.isCorrect ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          {ans.score}/{ans.maxScore} điểm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                      {ans.questionContent}
                    </h3>

                    <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80">
                      {(ans.questionType === "multiple_choice" ||
                        ans.questionType === "true_false") &&
                        renderChoiceDetails(ans)}

                      {ans.questionType === "essay" && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            Bài làm tự luận của bạn
                          </p>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                            {ans.essayAnswer || "Không có câu trả lời"}
                          </p>
                        </div>
                      )}

                      {ans.questionType === "coding" && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Mã nguồn đã nộp
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-xs font-mono font-semibold">
                                {ans.language || "code"}
                              </span>
                              {ans.judgeStatus && (
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    ans.judgeStatus === "accepted" ||
                                    ans.isCorrect
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {ans.judgeStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <pre className="text-xs bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">
                            {ans.codeAnswer || "// Không có mã nguồn"}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Giải thích (nếu có) */}
                    {ans.explanation && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                          <span className="font-bold">Giải thích: </span>
                          {ans.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 pb-6 flex justify-center">
          <button
            onClick={() =>
              navigate(`/student/courses/${sectionId}/assignments`)
            }
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về trang danh sách bài tập</span>
          </button>
        </div>
      </div>
    </div>
  );
}