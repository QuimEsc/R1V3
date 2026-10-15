(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ReforcCore = Object.freeze(api);
}(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const PHASES = ["SUPORT", "BASE", "REPTE"];
  const COMPETENCIES = [
    { id: "DIM1", label: "Nombres i operacions", weight: 35 },
    { id: "DIM2", label: "Tria de procediments", weight: 20 },
    { id: "DIM3", label: "Problemes breus", weight: 20 },
    { id: "DIM4", label: "Representació i interpretació", weight: 15 },
    { id: "DIM5", label: "Raonament i comprovació", weight: 10 }
  ];

  const MISSIONS = (root.R1V3CatalogMetadata || {missions:[]}).missions;
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function seeded(seed) {
    let value = 0;
    String(seed).split("").forEach((c) => { value = (value * 31 + c.charCodeAt(0)) >>> 0; });
    return function (min, max) {
      value = (value * 1664525 + 1013904223) >>> 0;
      return min + (value % (max - min + 1));
    };
  }
  function phaseIndex(phase) { return Math.max(0, PHASES.indexOf(String(phase || "BASE").toUpperCase())); }
  function exerciseId(missionId, phase, index) { return `${missionId}-${String(phase).slice(0, 1)}-${String(index + 1).padStart(2, "0")}`; }
  function make(mission, phase, index, q, a, hint, errorCode, format) {
    return {
      exerciseId: exerciseId(mission.missionId, phase, index), missionId: mission.missionId,
      route: phase, level: phase, step: index + 1, levelStep: index + 1, levelTotal: 5,
      questionHtml: `<p>${q}</p>`, expectedAnswer: String(a), hint1: hint || mission.rule,
      hint2: `${mission.example} Ara fes el teu exercici.`, methodId: mission.skill.toUpperCase(),
      errorCode: errorCode || mission.skill.toUpperCase(), competencyId: mission.competencyId,
      interactionType: "", answerMode: format || "NUMERICA", explanation: { title: mission.title, rule: mission.rule, example: mission.example }
    };
  }
  async function allExercises(){
    const catalog=await root.GameData.call('question_catalog');
    const solutions=new Map(catalog.solutions.map(q=>[q.id,q]));
    return catalog.questions.map(q=>({...q,exerciseId:q.id,expectedAnswer:solutions.get(q.id).expectedAnswer,modelSolution:solutions.get(q.id).modelSolution}));
  }
  async function exercisesForMission(missionId){return (await allExercises()).filter(q=>q.missionId===missionId);}
  function normalize(value) { return String(value == null ? "" : value).trim().toLowerCase().replace(/\s+/g, " ").replace(".", ",").replace("-", "−"); }
  function isCorrect(received, expected) {
    const left = normalize(received); const right = normalize(expected);
    if (left === right) return true;
    const ln = Number(left.replace(",", ".").replace("−", "-"));
    const rn = Number(right.replace(",", ".").replace("−", "-"));
    return Number.isFinite(ln) && Number.isFinite(rn) && Math.abs(ln - rn) < 1e-9;
  }
  function distractors(answer) {
    const n = Number(String(answer).replace(",", "."));
    if (Number.isFinite(n)) return [n, n + 1, n - 1, n + (Math.abs(n) < 10 ? 2 : 10)].map(String);
    const text = normalize(answer);
    if ([">","<","="].includes(text)) return [text, text === ">" ? "<" : ">", "=", "no es pot saber"];
    if (["+","−","×","÷"].includes(text)) return [text, "+", "−", "×", "÷"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
    const pools = {
      dilluns: ["dilluns","dimarts","iguals","no es pot saber"], dimarts: ["dimarts","dilluns","iguals","no es pot saber"],
      cm: ["cm","m","L","kg"], m: ["m","cm","L","kg"], l: ["L","kg","m","cm"], kg: ["kg","L","m","cm"]
    };
    return pools[text] || [String(answer), "0", "1", "cap"];
  }
  async function battleQuestions(missionId,count){
    const result=await root.GameData.call('battle_prepare',{missionId,battleType:count===20?'FINAL_SECTOR':'DIA'});
    return result.battle.questions;
  }
  function stateLabel(score, evidence) {
    if (!evidence) return "Sense evidència";
    if (score >= 8.5 && evidence >= 8) return "Consolidada";
    if (score >= 6) return "Assolida";
    return "En procés";
  }
  function calculateAssessment(attempts) {
    const rows = Array.isArray(attempts) ? attempts : [];
    const byComp = COMPETENCIES.map((comp) => {
      const evidence = rows.filter((r) => r.competencyId === comp.id && !r.gameOnly);
      const weighted = evidence.reduce((sum, r) => sum + clamp(Number(r.percent || 0), 0, 1), 0);
      const score = evidence.length ? Math.round(weighted / evidence.length * 100) / 10 : 0;
      return { ...comp, score, evidence: evidence.length, state: stateLabel(score, evidence.length) };
    });
    const present = byComp.filter((c) => c.evidence);
    const denominator = present.reduce((sum, c) => sum + c.weight, 0);
    const grade = denominator ? Math.round(present.reduce((sum, c) => sum + c.score * c.weight, 0) / denominator * 10) / 10 : null;
    return { grade, competencies: byComp, evidenceCount: rows.filter((r) => !r.gameOnly).length, needsTeacherValidation: true };
  }
  function shouldRecommendReport(summary) {
    const s = summary || {};
    const reasons = [];
    if (Number(s.sessionsWithoutProgress || 0) >= 3) reasons.push("3 sessions sense avanç");
    if (Number(s.lowMissionCount || 0) >= 2) reasons.push("2 missions per davall del 50%");
    if (Number(s.repeatedErrorCount || 0) >= 5) reasons.push("un error es repeteix 5 vegades");
    if (Number(s.supportSessionsWithoutImprovement || 0) >= 3) reasons.push("el suport no mostra millora encara");
    return { recommended: reasons.length > 0, reasons };
  }
  function arrivalMission(classMissionId, answers) {
    const current = MISSIONS.find((m) => m.missionId === classMissionId) || MISSIONS[0];
    const score = Array.isArray(answers) && answers.length ? answers.filter((x) => x.correct).length / answers.length : 0;
    const bridgeIndex = score >= .75 ? current.order - 1 : score >= .45 ? Math.max(0, current.order - 2) : Math.max(0, current.order - 5);
    return { missionId: MISSIONS[bridgeIndex].missionId, phase: "SUPORT", joinMissionId: current.missionId, score };
  }
  return { PHASES, COMPETENCIES, MISSIONS, exercisesForMission, allExercises, battleQuestions, isCorrect, calculateAssessment, shouldRecommendReport, arrivalMission };
}));
