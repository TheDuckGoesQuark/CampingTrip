# Ambience bed sources

Both beds are field recordings released under [Public Domain Mark
1.0](https://creativecommons.org/publicdomain/mark/1.0/), which imposes no
attribution requirement — the recordists are credited here because the licence
is the only thing standing between these files and a takedown, and a future
maintainer needs to be able to check it.

| File               | Source                                                                                                                                 | Recordist       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `rain-on-tent.mp3` | [Buis-les-Baronnies, France — nighttime rain and thunder inside a tent](https://archive.org/details/aporee_70516_82220)                | Jillis Molenaar |
| `dawn-chorus.mp3`  | [Dawn Chorus, Sakala Forest Reserve, Järvemaa, Estonia](https://archive.org/details/260502-dawn-chorus-sakala-forest-reserve-jarvemaa) | John Grzinich   |

## How the loops were cut

Each is a 60 s excerpt whose last 5 s were crossfaded onto its first 5 s, so the
end and the start hold the same material and `loop: true` wraps without a seam.
Both were then given a fixed gain — no compression, so the rain keeps its gusts
and the birds their transients — landing both at −20 LUFS integrated. That
shared loudness is what lets `AmbienceAudio` use one set of gain constants for
either bed.

The rain excerpt starts at 95 s of the source. The source title promises
thunder and delivers it at roughly 82–89 s and 165–177 s, each a ~19 dB
excursion in the 20–120 Hz band; the excerpt sits in the quiet 75 s between
them, because a thunderclap recurring every minute reads as a loop rather than
as weather. The dawn chorus excerpt starts at 2025 s of its source, the
steadiest minute on offer.

To re-cut either from its source, or to swap in a different recording:

```
ffmpeg -ss <start> -t 65 -i <source>.mp3 -af "volume=<gain>dB" -c:a pcm_s24le cut.wav
ffmpeg -i cut.wav -filter_complex \
  "[0]asplit=2[x][y];[x]atrim=0:60,asetpts=N/SR/TB[a];[y]atrim=60:65,asetpts=N/SR/TB[b];[b][a]acrossfade=d=5:c1=tri:c2=tri[out]" \
  -map "[out]" -c:a libmp3lame -q:a 6 <name>.mp3
```

Derive `<gain>` by measuring the cut with
`ffmpeg -i <source>.mp3 -af loudnorm=I=-20:print_format=json -f null -` and
taking the difference between its `input_i` and −20.
