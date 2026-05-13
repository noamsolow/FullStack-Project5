import { useSearchParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../components/ui/Status.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import PlannerCard from "./PlannerCard.jsx";
import TodoFilters from "./TodoFilters.jsx";
import TripForm from "./TripForm.jsx";
import TripHero from "./TripHero.jsx";
import { useTodos } from "./useTodos.js";

export default function TodosPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const todosState = useTodos({ user, params, setParams });

  if (todosState.loading) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading trips..." />
      </div>
    );
  }

  if (todosState.error) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <ErrorState message={todosState.error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-14">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-8">
        <TripHero
          activeTrip={todosState.activeTrip}
          activeTrips={todosState.activeTrips}
          progress={todosState.progress}
          onAddTrip={() => todosState.setShowTripForm((current) => !current)}
          onGoToTrip={todosState.goToTrip}
        />

        {todosState.showTripForm && (
          <TripForm
            tripDraft={todosState.tripDraft}
            tripImageName={todosState.tripImageName}
            onAddTrip={todosState.addTrip}
            onCoverUpload={todosState.handleTripCoverUpload}
            onTripDraftChange={todosState.setTripDraft}
          />
        )}

        <TodoFilters
          q={todosState.q}
          sort={todosState.sort}
          status={todosState.status}
          showTools={todosState.showTools}
          onToggleTools={() => todosState.setShowTools((current) => !current)}
          onUpdateQuery={todosState.updateQuery}
        />

        <section className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <PlannerCard
            title="Packing List"
            actionIcon="add"
            items={todosState.packingTodos}
            emptyTitle="No packing tasks"
            draft={todosState.drafts.packing}
            packingCategory={todosState.drafts.packingCategory}
            onDraftChange={(value) => todosState.setDrafts((current) => ({ ...current, packing: value }))}
            onPackingCategoryChange={(value) => todosState.setDrafts((current) => ({ ...current, packingCategory: value }))}
            onAdd={(event) => todosState.addTodo(event, "packing")}
            onMissingTrip={() => todosState.setShowTripForm(true)}
            onToggle={todosState.toggleTodo}
            onDelete={todosState.deleteTodo}
            editing={todosState.editing}
            setEditing={todosState.setEditing}
            onSave={todosState.saveTitle}
            hasTrip={Boolean(todosState.activeTrip)}
            notice={todosState.formNotice}
            clearNotice={() => todosState.setFormNotice("")}
            grouped
          />

          <PlannerCard
            title="Places to go"
            actionIcon="more_horiz"
            items={todosState.bucketTodos}
            emptyTitle="No places yet"
            draft={todosState.drafts.place}
            placeNote={todosState.drafts.placeNote}
            placeImage={todosState.drafts.placeImage}
            onDraftChange={(value) => todosState.setDrafts((current) => ({ ...current, place: value }))}
            onPlaceNoteChange={(value) => todosState.setDrafts((current) => ({ ...current, placeNote: value }))}
            onPlaceImageChange={(value) => todosState.setDrafts((current) => ({ ...current, placeImage: value }))}
            onAdd={(event) => todosState.addTodo(event, "bucket")}
            onMissingTrip={() => todosState.setShowTripForm(true)}
            onToggle={todosState.toggleTodo}
            onDelete={todosState.deleteTodo}
            editing={todosState.editing}
            setEditing={todosState.setEditing}
            onSave={todosState.saveTitle}
            hasTrip={Boolean(todosState.activeTrip)}
            notice={todosState.formNotice}
            clearNotice={() => todosState.setFormNotice("")}
          />
        </section>
      </main>
    </div>
  );
}
