import jade from "jade"
import compiler from "./compiler"

export default function fnJade(template, options={}) {
  return jade.render(template, Object.assign({compiler, template}, options))
}


console.log(
fnJade(`
style= require('./field.sass')
if league
  .fts-fantasy_field(
    class="fts-fantasy_field_" + league.gameType
    style=background)
    content
    .fts-players_section
      each position in positions
        .fts-players_section_row_wrapper
          .fts-players_section_row
            each player in playersFor(fantasyPlayerCollection, position)
              ft-player(
                gameweek=gameweek.id
                fantasy-player=player.id
                price-context=priceContext
                context=context)
            if context == 'edit'
              each slot in requiredSlots(fantasyPlayerCollection, position)
                .fts-players_section_required
              each slot in freeSlots(fantasyPlayerCollection, position)
                .fts-players_section_free
            unless context == 'show'
              .fts-field_placeholder(
                class=placeholderClass(fantasyTeam, position))
                unless playersFor(fantasyPlayerCollection, position).length
                  =l[position]

      .fts-subs_section_title
        h3=l.substitutions
      .fts-players_section_row_wrapper
        .fts-substitution_row
          each slot in benchSlots
            - var player = playerAtSlot(fantasyPlayerCollection, slot)
            if player
              ft-player(
                gameweek=gameweek.id
                fantasy-player=player.id
                price-context=priceContext
                context=context
                bench-slot=slot)
            else
              .fts-players_section_required
            if context != 'show'
              .fts-field_placeholder
                if !player
                  = benchOrdinal(slot)
`)
)
