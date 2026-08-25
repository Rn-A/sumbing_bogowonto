              {!showSegmentDetails ? (
                <>
                  <div className="w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-[#e7e5e4] shadow-sm bg-white dark:bg-[#F4F0E8]">
                    <iframe 
                      src="/route-map.html?embed=true" 
                      className="w-full h-[980px] border-0" 
                      scrolling="no"
                      title="Peta Rute Interaktif"
                    />
                  </div>

                  {/* Segmentasi Pos ke Pos (Overview Timeline) */}
                  {activeRoute.posts && activeRoute.posts.length > 0 && (
                    <div className="pt-6">
                      <h3 className="font-display font-black text-xl text-slate-900 dark:text-[#050505] mb-6 flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-[#0D5C3A]" />
                        Detail Rute (Pos ke Pos)
                      </h3>
                      <div className="relative border-l-2 border-[#0D5C3A]/20 dark:border-[#0D5C3A]/30 ml-4 space-y-6">
                        {[...activeRoute.posts]
                          .sort((a: any, b: any) => a.urutan - b.urutan)
                          .map((post: any, i: number) => (
                            <div key={post.id} className="relative pl-6">
                              <div className="absolute left-[-9px] top-1.5 w-4 h-4 rounded-full bg-[#0D5C3A] border-2 border-[#FAF8F5] flex items-center justify-center">
                              </div>
                              <h4 className="font-display font-bold text-sm text-slate-800 dark:text-[#050505]">
                                {post.nama_pos} <span className="text-[10px] font-normal text-slate-400 ml-2">({post.elevasi} mdpl)</span>
                              </h4>
                              <p className="text-xs text-slate-650 dark:text-[#707070] mt-1.5 leading-relaxed">
                                {post.deskripsi || 'Rute terus menanjak dan vegetasi mulai berubah sesuai ketinggian.'}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* ===== ROUTE SEGMENTATION DASHBOARD (Rewritten) ===== */
                <div className="space-y-6">

                {/* Two Column Layout: Sidebar Segments + Details Map/Chart/Stats */}
                <div className="grid lg:grid-cols-[260px_1fr] gap-6">
                  {/* ─── Left Column: Segment Menu List ─── */}
                  <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl p-5 border border-slate-200 dark:border-[#e7e5e4] shadow-sm self-start space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#e7e5e4] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-[#ea580c] rounded-full"></div>
                        <h5 className="font-display font-black text-sm text-slate-800 dark:text-[#050505]">Menu Segmentasi</h5>
                      </div>
                      <span className="bg-slate-100 dark:bg-[#EBE7DF] text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">{AUTO_SEGMENTS.length}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
                      {/* "Seluruh Rute" button (default active) */}
                      <button 
                        onClick={() => setActiveSegmentIndex(null)}
                        className={`w-full text-left px-3.5 py-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeSegmentIndex === null 
                            ? 'bg-[#0D5C3A]/10 border-[#0D5C3A]/25 text-[#0D5C3A] shadow-xs' 
                            : 'bg-transparent border-transparent hover:bg-slate-100/50 text-slate-600 dark:text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RouteIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Seluruh Rute</span>
                        </div>
                        <p className="text-[10px] font-normal text-slate-400 mt-0.5 ml-5.5">{TOTAL_STATS.totalDistance} km · +{TOTAL_STATS.totalGain} m</p>
                      </button>

                      {/* Segment buttons */}
                      {AUTO_SEGMENTS.map((seg, i) => {
                        const isActive = activeSegmentIndex === i;
                        const badgeColors: Record<string, string> = {
                          emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                          amber: 'bg-amber-100 text-amber-700 border-amber-200',
                          rose: 'bg-rose-100 text-rose-700 border-rose-200',
                        };
                        return (
                          <button 
                            key={i}
                            onClick={() => setActiveSegmentIndex(i)}
                            className={`w-full text-left px-3.5 py-2.5 border rounded-xl text-xs transition-all cursor-pointer ${
                              isActive 
                                ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50 text-[#ea580c] shadow-xs' 
                                : 'bg-transparent border-transparent hover:bg-slate-100/50 text-slate-600 dark:text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold truncate">{String(i + 1).padStart(2, '0')}  {seg.to_checkpoint}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border flex-shrink-0 ${badgeColors[seg.difficulty_color] || badgeColors.amber}`}>
                                {seg.difficulty}
                              </span>
                            </div>
                            <p className="text-[10px] font-normal text-slate-400 mt-0.5">{seg.distance_km.toFixed(1)} km · +{seg.elevation_gain_m} m</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ─── Right Column: Segment Details ─── */}
                  <div className="space-y-6">

                    {/* ── Statistics Panel ── */}
                    {activeSegment ? (
                      <div>
                        <p className="text-[9px] font-bold tracking-widest text-[#ea580c] uppercase">Statistik Segmen {activeSegmentIndex! + 1}</p>
                        <h4 className="font-display font-black text-lg text-slate-800 dark:text-[#050505] mt-1 mb-4">{activeSegment.label}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <RouteIcon className="w-3 h-3 text-[#0D5C3A]" /><span>Jarak</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-slate-800 dark:text-[#050505]">{activeSegment.distance_km.toFixed(2)}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">km</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <TrendingUp className="w-3 h-3 text-[#0D5C3A]" /><span>Elevasi Naik</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-emerald-700">+{activeSegment.elevation_gain_m}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <TrendingUp className="w-3 h-3 text-rose-500 rotate-180" /><span>Elevasi Turun</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-rose-600">-{activeSegment.elevation_loss_m}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <AlertTriangle className="w-3 h-3 text-[#0D5C3A]" /><span>Gradien</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-slate-800 dark:text-[#050505]">{activeSegment.avg_gradient_pct}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">%</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <Mountain className="w-3 h-3 text-[#0D5C3A]" /><span>Elevasi</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{activeSegment.elevation_start_m}</span>
                              <span className="text-xs font-bold text-slate-400 mx-1">→</span>
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{activeSegment.elevation_end_m}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <Clock className="w-3 h-3 text-[#0D5C3A]" /><span>Estimasi Waktu</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{formatTime(activeSegment.estimated_time_min)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[9px] font-bold tracking-widest text-[#ea580c] uppercase">Statistik Seluruh Rute</p>
                        <h4 className="font-display font-black text-lg text-slate-800 dark:text-[#050505] mt-1 mb-4">
                          {activeRoute.nama_jalur}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <RouteIcon className="w-3 h-3 text-[#0D5C3A]" /><span>Total Jarak</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-slate-800 dark:text-[#050505]">{TOTAL_STATS.totalDistance}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">km</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <TrendingUp className="w-3 h-3 text-[#0D5C3A]" /><span>Total Elevasi Naik</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-2xl font-black text-emerald-700">+{TOTAL_STATS.totalGain}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <Mountain className="w-3 h-3 text-[#0D5C3A]" /><span>Elevasi</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{TOTAL_STATS.elevStart}</span>
                              <span className="text-xs font-bold text-slate-400 mx-1">→</span>
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{TOTAL_STATS.elevEnd}</span>
                              <span className="text-xs font-bold text-slate-400 ml-1">m</span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-[#F4F0E8] rounded-xl p-3 border border-slate-100 dark:border-[#e7e5e4]">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-bold tracking-wider uppercase">
                              <Clock className="w-3 h-3 text-[#0D5C3A]" /><span>Estimasi Waktu</span>
                            </div>
                            <div className="mt-1.5 flex items-baseline">
                              <span className="text-lg font-black text-slate-800 dark:text-[#050505]">{formatTime(TOTAL_STATS.totalTimeMin)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Map & Elevation Chart (Combined Card) ── */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-bold tracking-widest text-[#ea580c] uppercase">Rute Dan Grafik</p>
                        <h4 className="font-display font-black text-xl text-slate-800 dark:text-[#050505] mt-1">
                          {activeSegment 
                            ? `Profil Elevasi: ${activeSegment.from_km.toFixed(1)} km – ${activeSegment.to_km.toFixed(1)} km`
                            : 'Peta jalur & profil elevasi'
                          }
                        </h4>
                      </div>
                      
                      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-[#e7e5e4] shadow-sm bg-white dark:bg-[#F4F0E8] relative flex flex-col">
                        {/* Map Layer Switcher Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#e7e5e4] bg-slate-50 dark:bg-[#FAF8F5]/40 backdrop-blur-xs gap-3 z-10">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PETA DASAR</span>
                          <div className="flex gap-0.5 border border-slate-250 dark:border-[#e7e5e4] rounded-xl overflow-hidden bg-white dark:bg-[#FAF8F5] p-0.5">
                            {(['streets', 'satellite', 'terrain', 'topo'] as const).map((style) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => setMapStyle(style)}
                                className={`px-3 py-1 text-[10px] font-bold capitalize transition-all cursor-pointer rounded-lg ${
                                  mapStyle === style
                                    ? 'bg-[#0D5C3A] text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-[#EBE7DF]/20'
                                }`}
                              >
                                {style}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Map */}
                        <div ref={mapRef} className="w-full h-[400px] bg-slate-100" />
                        
                        {/* Divider */}
                        <div className="border-t border-slate-200 dark:border-[#e7e5e4]" />

                        {/* Elevation Chart */}
                        <div className="p-5 space-y-4">
                          <div className="flex items-center justify-center gap-6 text-[10px] font-bold mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-2.5 border border-[#ea580c] bg-[#ea580c]/15 inline-block rounded-sm"></span>
                              <span className="text-slate-500">{activeSegment ? 'Segmen Terpilih' : 'Rute'}</span>
                            </div>
                            {activeSegment && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-2.5 border border-slate-300 bg-slate-100 inline-block rounded-sm"></span>
                                <span className="text-slate-500">Seluruh Rute</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart 
                                data={gpxTrackpoints.map((pt) => {
                                  const isActive = activeSegment 
                                    ? pt.distanceKm >= activeSegment.from_km && pt.distanceKm <= activeSegment.to_km 
                                    : true;
                                  return {
                                    name: `${(pt.distanceKm).toFixed(1)} km`,
                                    ketinggian: pt.elevation,
                                    activeKetinggian: isActive ? pt.elevation : null,
                                  };
                                })} 
                                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                onMouseMove={(state: any) => {
                                  if (state?.activePayload?.[0]?.payload) {
                                    const pt = gpxTrackpoints.find(
                                      (t) => `${t.distanceKm.toFixed(1)} km` === state.activePayload[0].payload.name
                                    );
                                    if (pt) setHoveredPoint(pt);
                                  }
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              >
                                <defs>
                                  <linearGradient id="segmentColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#a8a29e" fontSize={8} tickLine={false} interval="preserveStartEnd" />
                                <YAxis stroke="#a8a29e" fontSize={8} domain={['auto', 'auto']} tickLine={false} />
                                <Tooltip contentStyle={{ fontSize: 9, borderRadius: 8, border: 'none', background: '#050505', color: '#fff' }} />
                                <Area 
                                  type="monotone" 
                                  dataKey="ketinggian" 
                                  stroke="#cbd5e1" 
                                  strokeWidth={1.5} 
                                  fillOpacity={activeSegment ? 0.05 : 1} 
                                  fill={activeSegment ? '#f1f5f9' : 'url(#segmentColor)'}
                                  name="Elevasi"
                                />
                                {activeSegment && (
                                  <Area 
                                    type="monotone" 
                                    dataKey="activeKetinggian" 
                                    stroke="#ea580c" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#segmentColor)"
                                    dot={false}
                                    connectNulls={false}
                                    name="Segmen Aktif"
                                  />
                                )}
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}
