define("PoE/PassiveSkillTree/ObjectList", [], function() {
    return function() {
        this.init = function() {
            this.objects = [], this.priorities = [], this.priorityToObjects = {}
        }, this.add = function(i, t) {
            t = void 0 === t ? 0 : t, void 0 === this.priorityToObjects[t] && (this.priorities.push(t), this.priorityToObjects[t] = [], this.priorities.sort(function(i, t) {
                return i - t
            })), this.priorityToObjects[t].push(i)
        }, this.remove = function(i) {
            var t = !1;
            for (var r in this.priorityToObjects)
                for (var s = this.priorityToObjects[r], o = s.length - 1; o >= 0; --o) s[o] === i && (s.splice(o, 1), t = !0);
            return t
        }, this.foreachObject = function(i) {
            for (var t = 0, r = this.priorities.length; t < r; ++t)
                for (var s = this.priorityToObjects[this.priorities[t]], o = 0, e = s.length; o < e; ++o) i(s[o])
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/EventContainer", [], function() {
    return function() {
        this.init = function() {
            this.events = []
        }, this.trigger = function() {
            for (var t = 0, e = this.events.length; t < e; ++t) this.events[t]()
        }, this.add = function(t) {
            if (t instanceof Array)
                for (var e = 0, i = t.length; e < i; ++e) this.add(t[e]);
            else this.events.push(t)
        }, this.remove = function(t) {
            for (var e = 0; e < this.events.length; ++e) this.events[e] === t && this.events.splice(e, 1)
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/PassiveAllocation", [], function() {
    return function(i) {
        this.init = function() {
            this.skillTree = i, this.characterLevel = 100, this.extraSkillPoints = 24, this.skillPointsFromPassive = 0, this.ascendancySkillPoints = 8, this.numAllocatedAscendancySkills = 0, this.numAllocatedSkills = 0, this.allocatedSkills = {}, this.canAllocateSkills = {}
        }, this.foreachAllocatedSkill = function(i) {
            for (var l in this.allocatedSkills) i(this.allocatedSkills[l])
        }, this.isAllocated = function(i) {
            return void 0 !== this.allocatedSkills[i.skill.getHash()]
        }, this.loadHashArray = function(i) {
            this.reset();
            for (var l = 0, t = i.length; l < t; ++l) {
                var s = i[l];
                if (0 !== s) {
                    var e = this.skillTree.getNode(s);
                    e ? (e.isAscendancy ? (e.isMultipleChoiceOption || this.numAllocatedAscendancySkills++, e.passivePointsGranted >= 0 && (this.skillPointsFromPassive += e.passivePointsGranted)) : e.isBlightedNode || this.numAllocatedSkills++, this.allocatedSkills[s] = e, e && (e.active = !0, this.passiveAllocated(e.skill))) : console.log("Hash: " + s + " no longer exists in Passive Skill Tree.")
                }
            }
            this.recalcCanAllocateSkills(), this.skillTree.events.pointsChanged.trigger()
        }, this.allocate = function(i) {
            var l = this.skillTree.getNode(i),
                t = this;
            if (!this.canAllocate(l)) return !1;
            if (l.isMultipleChoiceOption) {
                var s = !1;
                if (l.foreachInNode(function(i) {
                        i.isMultipleChoice && (s = i)
                    }), !s) return !1;
                s.foreachOutNode(function(i) {
                    i.isMultipleChoiceOption && t.unallocate(i.id)
                })
            } else l.isAscendancy ? this.numAllocatedAscendancySkills++ : l.isBlightedNode || this.numAllocatedSkills++;
            return l.passivePointsGranted >= 0 && (this.skillPointsFromPassive += l.passivePointsGranted), l.active = !0, this.allocatedSkills[i] = l, this.recalcCanAllocateSkills(), this.passiveAllocated(l.skill), this.skillTree.pushHistoryState(), this.skillTree.events.pointsChanged.trigger(), !0
        }, this.unallocate = function(i) {
            var l = this.skillTree.getNode(i);
            return !!this.canUnallocate(l) && (l.isMultipleChoiceOption || (l.isAscendancy ? this.numAllocatedAscendancySkills-- : l.isBlightedNode || this.numAllocatedSkills--), l.passivePointsGranted && (this.skillPointsFromPassive -= l.passivePointsGranted), l.active = !1, delete this.allocatedSkills[i], this.recalcCanAllocateSkills(), this.passiveUnallocated(l.skill), this.skillTree.pushHistoryState(), this.skillTree.events.pointsChanged.trigger(), !0)
        }, this.canAllocate = function(i) {
            if (this.skillTree.readonly) return !1;
            if (i.active) return !1;
            if (i === this.skillTree.startNode) return !1;
            if (void 0 !== this.allocatedSkills[i.id]) return !1;
            if (i.isAscendancyStartNode) return !1;
            if (i.isBlightedNode) return !0;
            if (i.isMultipleChoiceOption)
                for (var l in i.inNodes) {
                    var t = i.inNodes[l];
                    if (!t.isMultipleChoiceOption && t.isMultipleChoice && t.active) return !0
                }
            for (var l in i.outNodes) {
                var s = i.outNodes[l];
                if (s.active || s.isClassStartPosition(this.skillTree.characterClass)) return !0
            }
            if (!i.isAscendancy && this.getPassiveSkillPointsAvailable() <= 0) return !1;
            if (i.isAscendancy && this.getAscendancyPassiveSkillPointsAvailable() <= 0) return !1;
            var e = this;
            return !1 !== i.findNeighbourNode(function(i) {
                return i.active || i.isClassStartPosition(e.skillTree.characterClass)
            })
        }, this.canUnallocate = function(i) {
            return !this.skillTree.readonly && (!i.isClassStartNode && !i.isAscendancyStartNode && (!!i.isBlightedNode || !!this.isAllocatedLeaf(i) && !(i.passivePointsGranted && i.passivePointsGranted > 0 && this.getPassiveSkillPointsAvailable() - i.passivePointsGranted < 0)))
        }, this.isAllocatedLeaf = function(i) {
            if (!i.active) return !1;
            var l = [];
            for (var t in this.skillTree.visitNodes(this.skillTree.startNode, [], l, function(l) {
                    return null === l.skill || l !== i && l.active
                }), this.allocatedSkills) {
                var s = this.allocatedSkills[t];
                if (!l[s.id]) {
                    if (!s.skill || s.id == i.id) continue;
                    return !1
                }
            }
            return !0
        }, this.recalcCanAllocateSkills = function() {
            this.clearCanAllocateSkills();
            var i = this;
            for (var l in this.allocatedSkills) {
                var t = this.allocatedSkills[l];
                t && t.foreachNeighbourNode(function(l) {
                    l.active || l.canAllocate || i.canAllocate(l) && (l.canAllocate = !0, i.canAllocateSkills[l.skill.getHash()] = l)
                })
            }
        }, this.clearCanAllocateSkills = function() {
            for (var i in this.canAllocateSkills) {
                this.canAllocateSkills[i].canAllocate = !1
            }
        }, this.reset = function() {
            for (var i in this.allocatedSkills) {
                var l = this.allocatedSkills[i];
                l.active = !1, this.passiveUnallocated(l.skill)
            }
            this.clearCanAllocateSkills(), this.skillPointsFromPassive = 0, this.numAllocatedSkills = 0, this.numAllocatedAscendancySkills = 0, this.allocatedSkills = {}, this.canAllocateSkills = {}, this.skillTree.events.pointsChanged.trigger()
        }, this.getTotalSkillPoints = function() {
            return this.extraSkillPoints + this.characterLevel - 1 + this.skillPointsFromPassive
        }, this.getTotalAscendancySkillPoints = function() {
            return this.ascendancySkillPoints
        }, this.getPassiveSkillPointsAvailable = function() {
            return this.getTotalSkillPoints() - this.numAllocatedSkills
        }, this.getAscendancyPassiveSkillPointsAvailable = function() {
            return this.getTotalAscendancySkillPoints() - this.numAllocatedAscendancySkills
        }, this.passiveAllocated = function() {}, this.passiveUnallocated = function() {}, this.init()
    }
});
define("PoE/PassiveSkillTree/Skill", ["PoE/Helpers"], function(i) {
    var s = function(s) {
        this.init = function() {
            if (this.hash = null, this.icon = null, this.iconActiveSources = s.iconHighlighted, this.skillDescription = s.sd, this.displayName = s.dn, this.flavourText = s.flavourText, this.reminderText = s.reminderText, this.sa = s.sa, this.da = s.da, this.ia = s.ia, this.item = s.item, this.jewel = s.jewel, this.radius = s.radius, void 0 !== s.id && (this.hash = s.id), void 0 !== s.icon && (this.icon = s.icon), s.passivePointsGranted && s.passivePointsGranted >= 0) {
                var t = "Passive Skill Point";
                s.passivePointsGranted > 1 && (t += "s"), this.skillDescription = [i.translate("Grants") + " " + s.passivePointsGranted + " " + i.translate(t)]
            }
        }, this.init()
    };
    return s.prototype.getHash = function() {
        return this.hash
    }, s
});
define("PoE/PassiveSkillTree/JewelAllocation", ["./Skill", "PoE/Item/Item", "PoE/Backbone/Model/Item/Item", "PoE/Item/LayoutManager"], function(e, l, a, t) {
    return function(i) {
        this.init = function() {
            this.skillTree = i, this.allocatedJewels = {}, this.layoutManager = new t
        }, this.loadJewels = function(t) {
            t.accountName && t.characterName && $.ajax({
                url: "/character-window/get-passive-skills",
                dataType: "json",
                data: {
                    accountName: t.accountName,
                    realm: t.realm || null,
                    character: t.characterName
                },
                success: function(i) {
                    if (i) {
                        t.jewelSlots = i.jewel_slots;
                        var s = i.visual_overrides;
                        for (var r in i.items) {
                            var n = i.items[r],
                                o = t.jewelSlots[n.x],
                                c = t.getNode(o),
                                d = new l({
                                    enableVerified: !1,
                                    enableLeague: !1,
                                    showSockets: !1,
                                    manualPosition: !0,
                                    model: new a(n)
                                });
                            d.render();
                            var u = {
                                id: o,
                                sd: !1,
                                dn: n.name,
                                sa: !1,
                                da: !1,
                                ia: !1,
                                icon: n.icon,
                                item: d,
                                jewel: n,
                                radius: null
                            };
                            for (var w in s) {
                                var f = s[w];
                                f[0] === n.x && (u.jewel.timelessJewelType = f[1])
                            }
                            if (n.properties)
                                for (var w in n.properties)
                                    if (n.properties[w].name && "Radius" === n.properties[w].name.string && n.properties[w].type) switch (n.properties[w].type) {
                                        case 26:
                                            u.radius = "Large";
                                            break;
                                        case 25:
                                            u.radius = "Medium";
                                            break;
                                        case 24:
                                            u.radius = "Small"
                                    }
                                    c.skill = new e(u)
                        }
                        t.drawState.dirty = !0, t.drawState.dirtyFullRedraw = !0
                    }
                },
                fail: function(e) {
                    console.log(e)
                }
            })
        }, this.foreachAllocatedJewel = function(e) {
            for (var l in this.allocatedJewels) e(this.allocatedJewels[l])
        }, this.allocate = function(e, l, a) {
            this.skillTree.getNode(l)
        }, this.jewelAllocated = function() {}, this.jewelUnallocated = function() {}, this.unLoadJewels = function(e) {
            if (e && e.jewelSlots) {
                for (var l in e.jewelSlots) {
                    var a = e.jewelSlots[l],
                        t = e.getNode(a);
                    t.skill.dn = null, t.skill.icon = null, t.skill.item = null, t.skill.jewel = null, t.skill.radius = null
                }
                e.drawState.dirty = !0, e.drawState.dirtyFullRedraw = !0
            }
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/Stats", [], function() {
    return function() {
        this.init = function() {
            this.attributes = [0, 0, 0]
        }, this.getAttribute = function(t) {
            return this.attributes[t]
        }, this.setAttribute = function(t, i) {
            this.attributes[t] = i, this.statsChanged()
        }, this.addAttribute = function(t, i) {
            this.attributes[t] += i, this.statsChanged()
        }, this.subAttribute = function(t, i) {
            this.attributes[t] -= i, this.statsChanged()
        }, this.statsChanged = function() {}, this.init()
    }
});
define("PoE/PassiveSkillTree/Node", ["./Skill"], function(t) {
    var i = function(i) {
        this.init = function() {
            this.group = null, this.orbit = i.o, this.orbitIndex = i.oidx, this.outNodes = {}, this.inNodes = {}, this.clickObj = null, this.keyStone = null, this.startPositionClasses = null, this.isClassStartNode = !1, this.notable = null, this.isJewel = i.isJewelSocket, this.id = i.id, this.isAscendancy = i.hasOwnProperty("ascendancyName"), this.ascendancyName = i.ascendancyName, this.isAscendancyStartNode = !!i.isAscendancyStart, this.isBlightedNode = i.isBlighted || !1, this.canAllocateWithoutConnection = !1, this.passivePointsGranted = i.passivePointsGranted, this.isMultipleChoice = i.isMultipleChoice, this.isMultipleChoiceOption = i.isMultipleChoiceOption, this.hidden = !1, this.active = !1, this.canAllocate = !1, this.renderState = {
                hover: !1
            }, this.popup = null, this.clickable = null, this.similarNodeHighlighter = null, this.pathHighlighterGroup = null, null !== i.ks && (this.keyStone = i.ks), void 0 !== i.spc && (this.startPositionClasses = i.spc, this.startPositionClasses.length > 0 && (this.isClassStartNode = !0)), void 0 !== i.not && (this.notable = i.not), void 0 !== i.m && (this.mastery = i.m), this.skill = new t(i)
        }, this.init()
    };
    return i.prototype.isClassStartPosition = function(t) {
        if (null === this.startPositionClasses) return !1;
        for (var i = 0, s = this.startPositionClasses.length; i != s; ++i)
            if (this.startPositionClasses[i] == t) return !0;
        return !1
    }, i.prototype.addOutNode = function(t) {
        this.outNodes[t.skill.getHash()] = t, t.addInNode(this)
    }, i.prototype.addInNode = function(t) {
        this.inNodes[t.skill.getHash()] = t
    }, i.prototype.setGroup = function(t) {
        this.group = t
    }, i.prototype.foreachOutNode = function(t) {
        for (var i in this.outNodes) t.call(this, this.outNodes[i])
    }, i.prototype.foreachInNode = function(t) {
        for (var i in this.inNodes) t.call(this, this.inNodes[i])
    }, i.prototype.foreachNeighbourNode = function(t) {
        this.foreachOutNode(t), this.foreachInNode(t)
    }, i.prototype.findNeighbourNode = function(t) {
        for (var i in this.outNodes)
            if (t.call(this, this.outNodes[i])) return this.outNodes[i];
        for (var i in this.inNodes)
            if (t.call(this, this.inNodes[i])) return this.inNodes[i];
        return !1
    }, i.prototype.isKeyStone = function() {
        return this.keyStone
    }, i.prototype.isMastery = function() {
        return this.mastery
    }, i.prototype.isSocketedJewel = function() {
        return this.isJewel && this.skill && this.skill.item
    }, i
});
define("PoE/PassiveSkillTree/Group", [], function() {
    var t = function(t, i, s) {
        this.id = t, this.position = i, this.nodes = {}, this.occupiedOrbits = s, this.isAscendancy = !1, this.ascendancyName = !1, this.oldPos = !1
    };
    return t.prototype.addNode = function(t) {
        this.nodes[t.skill.getHash()] = t, t.setGroup(this)
    }, t.prototype.getId = function() {
        return this.id
    }, t.prototype.foreachNode = function(t) {
        for (var i in this.nodes) t.call(this, this.nodes[i])
    }, t.prototype.isOccupiedOrbit = function(t) {
        return void 0 !== this.occupiedOrbits[t]
    }, t.prototype.isAscendancy = function() {
        return this.isAscendancy
    }, t.prototype.getAscendancy = function() {
        return this.ascendancyName
    }, t
});
define("PoE/PassiveSkillTree/Tile", [], function() {
    return function() {
        this.canvas = null, this.dirty = !0
    }
});
define("PoE/PassiveSkillTree/Clickable", [], function() {
    var o = function(o) {
        this.bounds = o, this.mouseMoved = !1
    };
    return o.prototype.hitTest = function(o) {
        return this.bounds.contains(o.worldPosition)
    }, o.prototype.onclickTest = function(o) {
        return !!this.hitTest(o) && (this.onclick(o), !0)
    }, o.prototype.onmousemoveTest = function(o) {
        if (!this.hitTest(o)) return !1;
        this.mouseMoved = !0, this.onmousemove(o)
    }, o.prototype.forceMouseOut = function() {
        if (!this.mouseMoved) return !1;
        this.mouseMoved = !1, this.onmouseout()
    }, o.prototype.onmouseoutTest = function(o) {
        return !!this.mouseMoved && (!this.hitTest(o) && (this.mouseMoved = !1, void this.onmouseout()))
    }, o.prototype.onclick = function(o) {}, o.prototype.onmousemove = function(o) {}, o.prototype.onmouseout = function(o) {}, o
});
define("PoE/PassiveSkillTree/BFS/PathIterator", [], function() {
    return function(t, e) {
        this.startNode = t, this.nodeRelationshipData = e, this.iterate = function(e) {
            var i = [],
                s = this.nodeRelationshipData[t.skill.getHash()].parents;
            i.push(t);
            var a = [];
            for (a.push(t), visited = {}; a.length > 0;)
                for (var h = a.pop(), n = this.nodeRelationshipData[h.skill.getHash()], o = 0, r = (s = n.parents).length; o < r; ++o) e(h, s[o], n.depth), void 0 === visited[s[o].skill.getHash()] && (visited[s[o].skill.getHash()] = !0, a.push(s[o]), i.push(s[o]));
            return i
        }, this.getStartNodeDepth = function() {
            return this.nodeRelationshipData[this.startNode.skill.getHash()].depth
        }
    }
});
define("PoE/PassiveSkillTree/UtilityFunctions", [], function() {
    return {
        calculateLerpPosition: function(t, i, n) {
            return (i - t) / n
        },
        calculateFlipPosition: function(t, i, n) {
            var e = (i - t) / n,
                r = e % 1;
            return 0 == parseInt(e) % 2 ? r : 1 - r
        }
    }
});
define("PoE/PassiveSkillTree/RGBA", ["./UtilityFunctions"], function(t) {
    return function i(s, e, n, a) {
        this.r = s || 0, this.g = e || 0, this.b = n || 0, this.a = a || 0, this.addA = function(t) {
            this.a += t, this.a > 1 && (this.a = 1)
        }, this.flipBetween = function(i, s, e, n, a, o, h, l) {
            this.setInterpolatedValue(i, s, t.calculateFlipPosition(e, n, a), t.calculateFlipPosition(e, n, o), t.calculateFlipPosition(e, n, h), t.calculateFlipPosition(e, n, l))
        }, this.lerpBetween = function(i, s, e, n, a, o, h, l) {
            this.setInterpolatedValue(i, s, t.calculateLerpPosition(e, n, a), t.calculateLerpPosition(e, n, o), t.calculateLerpPosition(e, n, h), t.calculateLerpPosition(e, n, l))
        }, this.setInterpolatedValue = function(t, i, s, e, n, a) {
            var o = this,
                h = function(s, e) {
                    t[s] < i[s] ? (o[s] = t[s] + (i[s] - t[s]) * e, o[s] > i[s] && (o[s] = i[s])) : (o[s] = t[s] - (t[s] - i[s]) * e, o[s] < i[s] && (o[s] = i[s]))
                };
            h("r", s), h("g", e), h("b", n), h("a", a), this.r = Math.round(this.r), this.g = Math.round(this.g), this.b = Math.round(this.b)
        }, this.getCanvasRGBA = function() {
            return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")"
        }, this.clone = function() {
            return new i(this.r, this.g, this.b, this.a)
        }
    }
});
define("PoE/PassiveSkillTree/PathHighlighter", ["./BFS/PathIterator", "./RGBA"], function(e, t) {
    return function(i, s, l) {
        this.init = function() {
            this.skillTree = i, this.drawObject = null, this.bfsPathIterator = new e(s, l), this.states = {
                BEGIN: 0,
                DEFAULT: 1,
                END: 2
            }, this.state = this.states.BEGIN, this.params = {}, this.params[this.states.DEFAULT] = {
                speed: 1e3,
                sFillC: new t(50, 50, 255, .4),
                eFillC: new t(50, 50, 255, .6),
                sStrokeC: new t(200, 200, 255, .4),
                eStrokeC: new t(255, 255, 255, .6)
            }, this.params[this.states.END] = {
                speed: 100,
                sFillC: null,
                sStrokeC: null,
                eFillC: new t,
                eStrokeC: new t(0, 0, 0, 0)
            }, this.params[this.states.BEGIN] = {
                speed: 50,
                sFillC: new t(255, 255, 255, 1),
                sStrokeC: new t(255, 255, 255, 1)
            }, this.params[this.states.BEGIN].eFillC = this.params[this.states.DEFAULT].sFillC, this.params[this.states.BEGIN].eStrokeC = this.params[this.states.DEFAULT].sStrokeC, this.events = {
                endFunc: function() {}
            }, this.start = (new Date).getTime(), this.setupDrawObject(), this.begin()
        }, this.setupDrawObject = function() {
            this.drawObject = new function(e) {
                this.init = function() {
                    this.highlighter = e, this.skillTree = e.skillTree, this.fillC = new t(50, 50, 255, .5), this.strokeC = new t(50, 50, 255, .6), this.fillC = new t(50, 50, 255, .5), this.strokeC = new t(50, 50, 255, .6)
                };
                var i = this;
                this.begin = function() {
                    var e = this.highlighter.params[this.highlighter.states.BEGIN],
                        t = this;
                    setTimeout(function() {
                        t.beginDefault()
                    }, e.speed)
                }, this.beginDefault = function(e) {
                    this.highlighter.start = e || (new Date).getTime(), this.highlighter.state = this.highlighter.states.DEFAULT
                }, this.end = function() {
                    this.highlighter.state = this.highlighter.states.END, this.highlighter.params[this.highlighter.states.END].sFillC = this.fillC.clone(), this.highlighter.params[this.highlighter.states.END].sStrokeC = this.strokeC.clone(), this.highlighter.start = (new Date).getTime();
                    var e = this;
                    setTimeout(function() {
                        e.endImmediately()
                    }, this.highlighter.params[this.highlighter.states.END].speed)
                }, this.endImmediately = function() {
                    this.skillTree.midDrawObjects.remove(this.highlighter.drawObject) && this.highlighter.events.endFunc()
                }, this.draw = function() {
                    var e = i.skillTree.midCtx,
                        t = function(e, t, s) {
                            var l = t.position,
                                r = (new Date).getTime();
                            switch (i.highlighter.state) {
                                case i.highlighter.states.BEGIN:
                                    var h = i.highlighter.params[i.highlighter.states.BEGIN];
                                    i.fillC.lerpBetween(h.sFillC, h.eFillC, i.highlighter.start, r, h.speed, h.speed, h.speed, h.speed), i.strokeC.lerpBetween(h.sStrokeC, h.eStrokeC, i.highlighter.start, r, h.speed, h.speed, h.speed, h.speed);
                                    break;
                                case i.highlighter.states.DEFAULT:
                                    h = i.highlighter.params[i.highlighter.states.DEFAULT];
                                    i.fillC.flipBetween(h.sFillC, h.eFillC, i.highlighter.start, r, h.speed, h.speed, h.speed, h.speed), i.strokeC.flipBetween(h.sStrokeC, h.eStrokeC, i.highlighter.start, r, h.speed, h.speed, h.speed, h.speed);
                                    break;
                                case i.highlighter.states.END:
                                    h = i.highlighter.params[i.highlighter.states.END];
                                    i.strokeC.lerpBetween(h.sStrokeC, h.eStrokeC, i.highlighter.start, r, h.speed, h.speed, h.speed, h.speed)
                            }
                            if (i.skillTree.viewPort.bounds.contains(l)) {
                                var a = i.skillTree.getNodeRadius(e);
                                if (l = i.skillTree.worldToScreen(l), i.skillTree.midCtx.beginPath(), i.skillTree.midCtx.lineWidth = 2, i.skillTree.midCtx.strokeStyle = "rgba(255,255,255,1)", i.skillTree.midCtx.fillStyle = "rgba(255,255,255,1)", i.skillTree.midCtx.arc(l.x, l.y, a * i.skillTree.viewPort.zoom, 0, 2 * Math.PI, !1), i.skillTree.midCtx.globalCompositeOperation = "destination-out", i.skillTree.midCtx.fill(), i.skillTree.midCtx.stroke(), i.skillTree.midCtx.strokeStyle = i.strokeC.getCanvasRGBA(), i.skillTree.midCtx.fillStyle = i.fillC.getCanvasRGBA(), i.skillTree.midCtx.globalCompositeOperation = "source-over", i.skillTree.midCtx.fill(), i.skillTree.midCtx.stroke(), null !== s) {
                                    var n = 50 * i.skillTree.viewPort.zoom,
                                        o = i.skillTree.midCtx.measureText(s).width;
                                    i.strokeC.addA(.3), i.skillTree.midCtx.fillStyle = i.strokeC.getCanvasRGBA(), i.skillTree.midCtx.font = n + "pt FontinBold", i.skillTree.midCtx.fillText(s, l.x - o / 2, l.y + n / 2)
                                }
                            } else i.skillTree.drawViewportIntersectionPoint(l, function(e) {
                                i.skillTree.topCtx.beginPath(), i.skillTree.topCtx.lineWidth = 2, i.skillTree.topCtx.strokeStyle = i.strokeC.getCanvasRGBA(), i.skillTree.topCtx.fillStyle = i.fillC.getCanvasRGBA(), i.skillTree.topCtx.arc(e.x, e.y, 2, 0, 2 * Math.PI, !1), i.skillTree.topCtx.fill(), i.skillTree.topCtx.stroke(), i.skillTree.drawState.topDirty = !0
                            })
                        };
                    i.highlighter.bfsPathIterator.iterate(function(t, s) {
                        i.skillTree.drawPathBetweenNodes(t, s, function(t, s) {
                            var l = t.position,
                                r = s.position;
                            l = i.skillTree.worldToScreen(l), r = i.skillTree.worldToScreen(r), e.beginPath(), e.lineWidth = 3, e.strokeStyle = i.strokeC.getCanvasRGBA(), e.moveTo(l.x, l.y), e.lineTo(r.x, r.y), e.stroke()
                        }, function(t, s, l, r) {
                            t = i.skillTree.worldToScreen(t), e.beginPath(), e.lineWidth = 3, e.strokeStyle = i.strokeC.getCanvasRGBA(), e.arc(t.x, t.y, r * i.skillTree.viewPort.zoom, s - Math.PI / 2, l - Math.PI / 2, !1), e.stroke()
                        })
                    }), i.highlighter.bfsPathIterator.iterate(function(e, s, l) {
                        t(s, i.skillTree.getNodePositionInfo(s), null)
                    }), t(i.highlighter.bfsPathIterator.startNode, i.skillTree.getNodePositionInfo(i.highlighter.bfsPathIterator.startNode), i.highlighter.bfsPathIterator.getStartNodeDepth())
                }, this.init()
            }(this), this.skillTree.midDrawObjects.add(this.drawObject, 0)
        }, this.begin = function() {
            this.drawObject.begin()
        }, this.beginDefault = function(e) {
            this.drawObject.beginDefault(e)
        }, this.end = function() {
            this.drawObject.end()
        }, this.endImmediately = function() {
            this.drawObject.endImmediately()
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/PathHighlighterGroup", ["./PathHighlighter"], function(t) {
    return function(i, h) {
        this.init = function() {
            this.skillTree = i, this.shortestPathsSets = h, this.pathHighlighters = []
        }, this.begin = function() {
            this.pathHighlighters = [];
            for (var i = 0, h = this.shortestPathsSets.length; i < h; ++i) s = this, e = this.shortestPathsSets[i], s.pathHighlighters[i] = new t(s.skillTree, e.goalNodeData.node, e.nodeRelationshipData);
            var s, e
        }, this.end = function() {
            for (var t = 0, i = this.shortestPathsSets.length; t < i; ++t) this.pathHighlighters[t].end()
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/Popup", [], function() {
    var t = function(t, s, i, h, e, n, a) {
        this.id = t, this.destCanvas = s, this.destCtx = s.getContext("2d"), this.x = i, this.y = h, this.contentRenderFunc = a, this.resize(e, n)
    };
    return t.prototype.resize = function(t, s) {
        this.canvas = document.createElement("canvas"), this.ctx = this.canvas.getContext("2d"), this.canvas.width = t, this.canvas.height = s
    }, t.prototype.draw = function() {
        this.contentRenderFunc(this, !0, this.ctx), this.ctx.lineWidth = 4, this.ctx.fillStyle = "rgba(0,0,0,.80)", this.ctx.strokeStyle = "rgb(203,181,156)", this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height), this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height), this.ctx.fill(), this.ctx.stroke(), this.contentRenderFunc(this, !1, this.ctx);
        var t = this.x,
            s = this.y,
            i = t + this.canvas.width,
            h = s + this.canvas.height;
        i > this.destCanvas.width && (t -= i - this.destCanvas.width), h > this.destCanvas.height && (s -= h - this.destCanvas.height), this.destCtx.drawImage(this.canvas, t, s)
    }, t
});
define("PoE/PassiveSkillTree/BFS/NodeData", [], function() {
    return function(e, t) {
        this.node = e, this.parents = [], this.depth = t
    }
});
define("PoE/PassiveSkillTree/ByteDecoder", [], function() {
    return function() {
        this.init = function() {
            this.dataString = "", this.position = 0
        }, this.bytesToInt16 = function(t) {
            return this.bytesToInt(t, 2)
        }, this.bytesToInt = function(t, i) {
            i = i || 4;
            for (var n = 0, s = 0; s < i; ++s) n += t[s], s < i - 1 && (n <<= 8);
            return n
        }, this.hasData = function() {
            return this.position < this.dataString.length
        }, this.getDataString = function() {
            return this.dataString
        }, this.setDataString = function(t) {
            this.dataString = t, this.position = 0
        }, this.readInt8 = function() {
            return this.readInt(1)
        }, this.readInt16 = function() {
            return this.readInt(2)
        }, this.readInt = function(t) {
            t = t || 4;
            var i = this.position + t;
            if (i > this.dataString.length) throw "Integer read exceeds bounds";
            for (var n = []; this.position < i; ++this.position) n.push(this.dataString.charAt(this.position).charCodeAt(0));
            return this.bytesToInt(n, t)
        }, this.init()
    }
});
define("PoE/PassiveSkillTree/NodeHighlighter/AnimationType", [], function() {
    return {
        Default: 0,
        In: 1,
        Out: 2
    }
});
define("PoE/PassiveSkillTree/NodeHighlighter/NodeHighlighter", ["jquery", "PoE/PassiveSkillTree/RGBA", "./AnimationType"], function(t, e, i) {
    var o = function(t, o) {
        this.acceptFunc = function(t) {
            return !0
        }, this.animations = {}, this.animations[i.In] = {
            speed: 50,
            fillColour: {
                start: new e(255, 255, 255, 1)
            },
            strokeColour: {
                start: new e(255, 255, 255, 1)
            }
        }, this.animations[i.Default] = {
            speed: 1e3,
            fillColour: {
                start: new e(255, 213, 47, .3),
                end: new e(255, 213, 47, .6)
            },
            strokeColour: {
                start: new e(255, 213, 47, .4),
                end: new e(255, 213, 47, .7)
            }
        }, this.animations[i.Out] = {
            speed: 100,
            fillColour: {
                start: null,
                end: new e
            },
            strokeColour: {
                start: null,
                end: new e(0, 0, 0, 0)
            }
        }, this.skillTree = t, this.init(o)
    };
    return o.prototype.draw = function() {
        var t = (new Date).getTime();
        switch (this.animationState) {
            case i.In:
                var e = this.animations[i.In];
                this.fillColour.lerpBetween(e.fillColour.start, e.fillColour.end, this.start, t, e.speed, e.speed, e.speed, e.speed), this.strokeColour.lerpBetween(e.strokeColour.start, e.strokeColour.end, this.start, t, e.speed, e.speed, e.speed, e.speed);
                break;
            case i.Default:
                e = this.animations[i.Default];
                this.fillColour.flipBetween(e.fillColour.start, e.fillColour.end, this.start, t, e.speed, e.speed, e.speed, e.speed), this.strokeColour.flipBetween(e.strokeColour.start, e.strokeColour.end, this.start, t, e.speed, e.speed, e.speed, e.speed);
                break;
            case i.Out:
                e = this.animations[i.Out];
                this.strokeColour.lerpBetween(e.strokeColour.start, e.strokeColour.end, this.start, t, e.speed, e.speed, e.speed, e.speed)
        }
        for (var o = 0, s = this.nodes.length; o < s; ++o) {
            var l = this.nodes[o],
                r = this.skillTree.getNodeRadius(l),
                n = this.skillTree.getNodePositionInfo(l).position;
            if (this.skillTree.viewPort.bounds.contains(n)) n = this.skillTree.worldToScreen(n), this.skillTree.midCtx.beginPath(), this.skillTree.midCtx.lineWidth = 2, this.skillTree.midCtx.strokeStyle = this.strokeColour.getCanvasRGBA(), this.skillTree.midCtx.fillStyle = this.fillColour.getCanvasRGBA(), this.skillTree.midCtx.arc(n.x, n.y, r * this.skillTree.viewPort.zoom, 0, 2 * Math.PI, !1), this.skillTree.midCtx.fill(), this.skillTree.midCtx.stroke();
            else {
                var a = this;
                this.skillTree.drawViewportIntersectionPoint(n, function(t) {
                    a.skillTree.topCtx.beginPath(), a.skillTree.topCtx.lineWidth = 2, a.skillTree.topCtx.strokeStyle = a.strokeColour.getCanvasRGBA(), a.skillTree.topCtx.fillStyle = a.fillColour.getCanvasRGBA(), a.skillTree.topCtx.arc(t.x, t.y, 2, 0, 2 * Math.PI, !1), a.skillTree.topCtx.fill(), a.skillTree.topCtx.stroke(), a.skillTree.drawState.topDirty = !0
                })
            }
        }
    }, o.prototype.begin = function() {
        var t = this;
        this.animations[i.In].fillColour.end = this.animations[i.Default].fillColour.start, setTimeout(function() {
            t.beginDefault()
        }, this.animations[i.In].speed)
    }, o.prototype.beginDefault = function(t) {
        this.start = t || (new Date).getTime(), this.animationState = i.Default
    }, o.prototype.end = function(e) {
        var o = t.Deferred(),
            s = this;
        return this.animationState = i.Out, this.animations[i.Out].fillColour.start = this.fillColour.clone(), this.animations[i.Out].strokeColour.start = this.strokeColour.clone(), this.start = (new Date).getTime(), setTimeout(function() {
            s.endImmediately(), o.resolve()
        }, this.animations[i.Out].speed), o.promise()
    }, o.prototype.endImmediately = function() {
        this.skillTree.midDrawObjects.remove(this.drawObject)
    }, o.prototype.copyStateFrom = function(t) {
        this.start = t.start, this.fillColour = t.fillColour.clone(), this.strokeColour = t.strokeColour.clone()
    }, o.prototype.init = function(t) {
        t && t.animations && this.configAnimation(t.animations), this.fillColour = new e, this.strokeColour = new e, this.start = (new Date).getTime(), this.nodes = t.nodes || [], this.animationState = i.In, this.animations[i.In].fillColour.end = this.animations[i.Default].fillColour.start, this.animations[i.In].strokeColour.end = this.animations[i.Default].strokeColour.start;
        var o = this;
        this.drawObject = {
            draw: function() {
                o.draw()
            }
        }, this.skillTree.midDrawObjects.add(this.drawObject, 10)
    }, o.prototype.setNodes = function(t) {
        this.nodes = t
    }, o.prototype.configAnimation = function(t) {
        if (t) {
            var e = function(t, e) {
                void 0 !== e.speed && (t.speed = e.speed), e.fillColour && (e.fillColour.start && (t.fillColour.start = e.fillColour.start), e.fillColour.end && (t.fillColour.end = e.fillColour.end)), e.strokeColour && (e.strokeColour.start && (t.strokeColour.start = e.strokeColour.start), e.strokeColour.end && (t.strokeColour.end = e.strokeColour.end))
            };
            t && void 0 !== t[i.Default] && e(this.animations[i.Default], t[i.Default]), t && void 0 !== t[i.In] && e(this.animations[i.In], t[i.In]), t && void 0 !== t[i.Out] && e(this.animations[i.Out], t[i.Out])
        }
    }, o
});
define("PoE/PassiveSkillTree/NodeHighlighter/NodeHighlighterGroup", [], function() {
    var t = function(t) {
        this.init(t)
    };
    return t.prototype.foreachHighlighter = function(t) {
        for (var i = 0, e = this.highlighters.length; i < e; ++i) t(this.highlighters[i], i)
    }, t.prototype.begin = function() {
        this.foreachHighlighter(function(t) {
            t.begin()
        })
    }, t.prototype.beginDefault = function(t) {
        this.foreachHighlighter(function(i) {
            i.beginDefault(t)
        })
    }, t.prototype.end = function() {
        var t = [];
        return this.foreachHighlighter(function(i) {
            t.push(i.end())
        }), $.when.apply(null, t)
    }, t.prototype.endImmediately = function() {
        this.foreachHighlighter(function(t) {
            t.endImmediately()
        })
    }, t.prototype.copyStateFrom = function(t) {
        this.foreachHighlighter(function(i, e) {
            i.copyStateFrom(t.getHighlighter(e))
        })
    }, t.prototype.getHighlighter = function(t) {
        return this.highlighters[t]
    }, t.prototype.init = function(t) {
        t && (this.highlighters = t.highlighters || [])
    }, t
});

function _typeof(t) {
    return (_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
        return typeof t
    } : function(t) {
        return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
    })(t)
}
define("PoE/PassiveSkillTree/PassiveSkillTree", ["plugins", "PoE/Geom/Bounds", "PoE/Geom/Point", "PoE/PassiveSkillTree/ObjectList", "PoE/PassiveSkillTree/EventContainer", "PoE/PassiveSkillTree/PassiveAllocation", "PoE/PassiveSkillTree/JewelAllocation", "PoE/PassiveSkillTree/Stats", "PoE/PassiveSkillTree/Node", "PoE/PassiveSkillTree/Group", "PoE/PassiveSkillTree/Tile", "PoE/PassiveSkillTree/Clickable", "PoE/PassiveSkillTree/PathHighlighterGroup", "PoE/PassiveSkillTree/Popup", "PoE/PassiveSkillTree/BFS/NodeData", "PoE/PassiveSkillTree/ByteDecoder", "PoE/PassiveSkillTree/ByteEncoder", "PoE/PassiveSkillTree/NodeHighlighter/NodeHighlighter", "PoE/PassiveSkillTree/NodeHighlighter/AnimationType", "PoE/PassiveSkillTree/NodeHighlighter/NodeHighlighterGroup", "PoE/PassiveSkillTree/RGBA", "PoE/Helpers", "PoE/Item/Item", "PoE/Backbone/Model/Item/Item", "PoE/PassiveSkillTree/GenerateLink", "PoE/PassiveSkillTree/Version"], function(t, e, i, s, a, n, r, o, h, l, c, d, u, g, v, w, f, p, m, S, y, P, b, C, A, x) {
    var k = function f(m, y, b, C, x, k, T, I) {
        this.init = function() {
            var h = !1;
            if (t("body").hasClass("tencent") && (h = !0), this.containerEl = t("#" + m), !this.isCanvasSupported()) {
                var l = "https://www.google.com/chrome/",
                    c = "http://www.mozilla.org/firefox/",
                    d = "http://www.apple.com/safari/",
                    u = "http://www.opera.com/download/";
                return h && (l = "http://www.google.cn/intl/zh-CN/chrome/", c = "http://www.firefox.com.cn/", d = "http://www.apple.com/cn/safari/", u = "http://www.opera.com/zh-cn"), void this.containerEl.append('<h1 class="error">' + P.translate("The Passive Skill Tree requires a browser that supports canvas.") + '</h1><p class="error m-pad">If you are running Internet Explorer you need at least version 9. If you are running Internet Explorer 9 and get this message, please make sure compatibility view is disabled.<br /><br />You may need to upgrade your browser. Some other browsers that work with the passive skill tree are: <a href="' + l + '">Chrome</a>, <a href="' + c + '">Firefox</a>, <a href="' + d + '">Safari</a> ' + P.translate("and") + ' <a href="' + u + '">Opera</a>.</p>')
            }
            var g = this;
            this.fullscreenContainerEl = t("#" + y), this.containerEl.width(b), this.containerEl.height(C), this.totW = 1e3, this.totH = 1e3, this.xshift = Math.ceil(this.totW / 2), this.yshift = Math.ceil(this.totH / 2), this.accountName = !1, this.characterName = !1, this.characterClass = !1, this.ascendancyClass = !1, this.ascendancyClasses = I.ascClasses, this.ascendancyClassPopupHidden = !0, this.ascendancyStartNode = !1, this.ascendancyButton = {
                state: "PassiveSkillScreenAscendancyButton",
                clickable: !1
            }, this.initialWidth = b, this.initialHeight = C, this.canvas = document.createElement("canvas"), this.lastQuery = "", this.canvas.width = b, this.canvas.height = C, this.containerEl.append(this.canvas), this.$window = t(window), this.$bodyEl = t("body"), this.$canvas = t(this.canvas), this.$canvas.attr("id", "skillTreeMainCanvas"), this.ctx = this.canvas.getContext("2d"), this.midCanvas = document.createElement("canvas"), this.containerEl.append(this.midCanvas), this.$midCanvas = t(this.midCanvas), this.$midCanvas.attr("id", "skillTreeMidCanvas"), this.$midCanvas.css("pointer-events", "none"), this.midCanvas.width = this.canvas.width, this.midCanvas.height = this.canvas.height, this.midCtx = this.midCanvas.getContext("2d"), this.topCanvas = document.createElement("canvas"), this.$topCanvas = t(this.topCanvas), this.$topCanvas.attr("id", "skillTreeTopCanvas"), this.$topCanvas.css("pointer-events", "none"), this.containerEl.append(this.topCanvas), this.topCanvas.width = this.canvas.width, this.topCanvas.height = this.canvas.height, this.topCtx = this.topCanvas.getContext("2d"), this.scaleFactor = this.canvas.height / 1600, this.fps = 0, this.frames = 0, this.debug = !1, this.nodeRadius = 51, this.nodeRadiusKeystone = 109, this.nodeRadiusNotable = 70, this.nodeRadiusJewel = 70, this.nodeRadiusMastery = 107, this.nodeRadiusClassStart = 200, this.groups = {}, this.nodes = {}, this.extent = new e, this.tileSize = 512, this.tiles = [], this.finalDrawFuncs = [], this.popupId = 0, this.popups = {}, this.assets = {}, this.characterData = T.characterData, this.constants = T.constants, this.imageZoomLevels = T.imageZoomLevels, this.skillSprites = T.skillSprites, this.skillsPerOrbit = T.constants.skillsPerOrbit, this.orbitRadii = T.constants.orbitRadii, this.characterClassToStartNode = {}, this.ascendancyClassToStartNode = {}, this.readonly = !1, this.fullScreen = !1, this.errorMessage = null, this.settings = {
                highlightSimilarNodes: !1,
                highlightShortestPaths: !1
            }, this.allowFullscreenKey = !0, this.buildUrl = null, this.mousePos = new i(-1, -1), this.midDrawObjects = new s, this.events = {
                classChosen: function() {},
                historyUrlSet: function(t) {},
                buildUrlSet: function(t) {},
                pointsChanged: new a,
                onload: function() {},
                onFullScreenUpdate: function() {},
                onFullScreenBegin: function() {},
                onFullScreenEnd: function() {}
            }, this.characterAttributes = [0, 0, 0], this.searchHighlighter = null, this.initializationComplete = t.Deferred(), this.loadCounter = 0, this.version = null, this.realm = null, this.jewelCircles = [], I && (I.events && (I.events.classChosen && (this.events.classChosen = I.events.classChosen), I.events.historyUrlSet && (this.events.historyUrlSet = I.events.historyUrlSet), I.events.buildUrlSet && (this.events.buildUrlSet = I.events.buildUrlSet), I.events.pointsChanged && this.events.pointsChanged.add(I.events.pointsChanged), I.events.onload && (this.events.onload = I.events.onload), I.events.onFullScreenUpdate && (this.events.onFullScreenUpdate = I.events.onFullScreenUpdate), I.events.onFullScreenBegin && (this.events.onFullScreenBegin = I.events.onFullScreenBegin), I.events.onFullScreenEnd && (this.events.onFullScreenEnd = I.events.onFullScreenEnd)), I.noFullscreenKey && (this.allowFullscreenKey = !1), I.readonly && (this.readonly = !0), I.buildUrl && (this.buildUrl = I.buildUrl), I.circles && (this.circles = I.circles), this.version = I.version, this.realm = I.realm), this.passiveAllocation = new n(this), this.passiveAllocation.passiveAllocated = function(t) {
                g.drawState.dirty = !0, g.drawState.topDirty = !0, g.stats.addAttribute(g.constants.characterAttributes.Strength, t.sa), g.stats.addAttribute(g.constants.characterAttributes.Dexterity, t.da), g.stats.addAttribute(g.constants.characterAttributes.Intelligence, t.ia)
            }, this.passiveAllocation.passiveUnallocated = function(t) {
                g.drawState.dirty = !0, g.drawState.topDirty = !0, g.stats.subAttribute(g.constants.characterAttributes.Strength, t.sa), g.stats.subAttribute(g.constants.characterAttributes.Dexterity, t.da), g.stats.subAttribute(g.constants.characterAttributes.Intelligence, t.ia)
            }, this.jewelAllocation = new r(this), this.jewelAllocation.jewelAllocated = function(t) {
                g.drawState.dirty = !0, g.drawState.topDirty = !0
            }, this.jewelAllocation.jewelUnallocated = function(t) {
                g.drawState.dirty = !0, g.drawState.topDirty = !0
            }, this.stats = new o, this.stats.statsChanged = function() {}, this.drawState = {
                dirty: !0,
                topDirty: !0,
                dirtyFullRedraw: !0,
                cancelInProgress: !1,
                active: !1,
                idle: !0,
                lastFrame: null
            }, this.worldToView = function(t) {};
            var v = this.initAssets();
            g.initLoadingRenderLoop(), v.done(function() {
                g.initGraph(), g.initViewPort(), g.initListeners(), g.initKeyListeners(), g.initMouseListeners(), g.initTileGrid(), I && I.fullscreen && !g.fullScreen && g.toggleFullScreen(!0), g.setCharacterClass(x), g.loadBaseCharacterAttributes(), g.endLoadingRenderLoop(), g.events.pointsChanged.trigger(), g.events.onload(), g.initRenderLoop(), g.initializationComplete.resolve()
            }), window.onpopstate = function(t) {
                null !== t.state && g.loadStateFromUrl()
            }
        }, this.toggleFullScreen = function(t) {
            if (window.top.location != document.location) {
                if (this.fullScreen) return;
                this.fullScreen = !0
            } else this.fullScreen = !this.fullScreen;
            this.$bodyEl.css("overflow", this.fullScreen ? "hidden" : "visible"), this.updateCanvasSize(), this.fullScreen ? (this.fullscreenContainerEl.append(this.canvas).append(this.midCanvas).append(this.topCanvas), this.events.onFullScreenBegin()) : (this.containerEl.append(this.canvas).append(this.midCanvas).append(this.topCanvas), this.events.onFullScreenEnd()), t || this.pushHistoryState()
        }, this.updateCanvasSize = function() {
            if (this.fullScreen) {
                var t = this.events.onFullScreenUpdate() || {
                    top: "0px",
                    left: "0px",
                    width: this.$window.width(),
                    height: this.$window.height()
                };
                this.$canvas.css("position", "fixed").css("top", t.top).css("left", t.left), this.$midCanvas.css("position", "fixed").css("top", t.top).css("left", t.left), this.$topCanvas.css("position", "fixed").css("top", t.top).css("left", t.left), this.canvas.width = t.width, this.canvas.height = t.height, this.midCanvas.width = t.width, this.midCanvas.height = t.height, this.topCanvas.width = t.width, this.topCanvas.height = t.height
            } else this.$canvas.css("position", "absolute"), this.$midCanvas.css("position", "absolute"), this.$topCanvas.css("position", "absolute"), this.canvas.width = this.initialWidth, this.canvas.height = this.initialHeight, this.midCanvas.width = this.initialWidth, this.midCanvas.height = this.initialHeight, this.topCanvas.width = this.initialWidth, this.topCanvas.height = this.initialHeight;
            this.forceMouseOut(), this.initTileGrid(), this.viewPort.recalcBounds(), this.drawState.dirtyFullRedraw = !0, this.drawState.dirty = !0, this.drawState.topDirty = !0
        }, this.isCanvasSupported = function() {
            var t = document.createElement("canvas");
            return !(!t.getContext || !t.getContext("2d"))
        }, this.isAudioSupported = function() {
            var t = document.createElement("audio");
            return t.canPlayType && t.canPlayType('audio/ogg; codecs="vorbis"')
        }, this.isHistorySupported = function() {
            return !(!window.history || !history.pushState)
        }, this.loadStateFromUrl = function() {
            var t = window.location.href,
                e = this;
            this.initializationComplete.done(function() {
                if ("" != window.location.search) {
                    var i = P.getUrlParameter("accountName"),
                        s = P.getUrlParameter("characterName");
                    i && s && (e.accountName = i, e.characterName = s), t = t.substring(0, t.indexOf(window.location.search))
                }
                var a = t.split("/"),
                    n = a[a.length - 1],
                    r = a[a.length - 2];
                "passive-skill-tree" == n || "" == n && "passive-skill-tree" == r || e.buildUrl || e.loadHistoryUrl("" == n ? r : n)
            })
        }, this.loadBaseCharacterAttributes = function() {
            this.stats.setAttribute(this.constants.characterAttributes.Strength, this.characterData[this.characterClass].base_str), this.stats.setAttribute(this.constants.characterAttributes.Dexterity, this.characterData[this.characterClass].base_dex), this.stats.setAttribute(this.constants.characterAttributes.Intelligence, this.characterData[this.characterClass].base_int)
        }, this.pushHistoryState = function() {
            if (this.isHistorySupported()) {
                var t = this.getHistoryUrl();
                window.history.pushState({}, "", t), this.events.historyUrlSet(t)
            }
        }, this.fullRedraw = function() {
            this.drawState.dirty = !0, this.drawState.dirtyFullRedraw = !0
        }, this.reset = function(t) {
            this.passiveAllocation.reset();
            var e = !1;
            t && t.characterClass >= 0 && this.setCharacterClass(t.characterClass, t.ascendancyClass), t && void 0 !== _typeof(t.accountName) && (this.accountName = t.accountName, e = !0), t && void 0 !== _typeof(t.characterName) && (this.characterName = t.characterName, e = !0), this.lastQuery && "" != this.lastQuery && this.highlightSearchQuery(this.lastQuery), this.pushHistoryState(), e && this.jewelAllocation.unLoadJewels(this), this.fullRedraw()
        }, this.setCharacterClass = function(t, e) {
            this.characterClass = t, e || (e = 0), this.setAscendancyClass(e), this.startNode && (this.startNode.active = !1), this.ascendancyStartNode && (this.ascendancyStartNode.active = !1), this.startNode = this.characterClassToStartNode[t], this.startNode.active = !0, this.ascendancyClass && this.ascendancyClass > 0 && (this.ascendancyStartNode = this.ascendancyClassToStartNode[this.ascendancyClassName()], this.ascendancyStartNode.active = !0), this.viewPort.setPosition(this.getNodePositionInfo(this.startNode).position), this.loadBaseCharacterAttributes(), this.events.classChosen(t, e)
        }, this.setAscendancyClass = function(t) {
            this.ascendancyClass = t, t <= 0 && (this.ascendancyClassPopupHidden = !0)
        }, this.loadCharacterData = function(t, e, i) {
            this.passiveAllocation.reset(), this.setCharacterClass(t, e), this.passiveAllocation.loadHashArray(i), this.jewelAllocation.loadJewels(this), this.events.historyUrlSet(this.getHistoryUrl()), this.fullRedraw()
        }, this.drawArc = function(t, e, i, s, a, n) {
            var r = a - s,
                o = r / (Math.PI / 2),
                h = r;
            t.save(), t.translate(Math.round(i.x), Math.round(i.y)), t.scale(n, n), t.rotate(-Math.PI), t.rotate(s);
            for (var l = 0, c = Math.ceil(o); l < c; ++l) h < Math.PI / 2 ? (t.beginPath(), t.lineWidth = 4, t.fillStyle = "rgba(200,0,0,.5)", t.strokeStyle = "rgba(150,150,0,.8)", t.moveTo(0, 0), t.arc(0, 0, e.width, Math.PI, h + Math.PI, !1), t.clip(), t.drawImage(e, 0, 0, e.width, e.height, -e.width, -e.height, e.width, e.height)) : (t.drawImage(e, 0, 0, e.width, e.height, -e.width, -e.height, e.width, e.height), t.rotate(Math.PI / 2), h -= Math.PI / 2);
            t.restore()
        }, this.drawStraightPath = function(t, e, i, s, a, n, r) {
            for (var o = function(t, e, i) {
                    return (1 - t) * e.x + t * i.x
                }, h = function(t, e, i) {
                    return (1 - t) * e.y + t * i.y
                }, l = i.distTo(s), c = e.width * a, d = l, u = l / c, g = 1 / u, v = i.angleTo(s), w = 0, f = 0, p = Math.ceil(u); f < p; ++f) {
                var m = e.width;
                d < c && (m *= d / c), t.save(), t.translate(Math.round(o(w, i, s)), Math.round(h(w, i, s))), t.scale(a, a), t.rotate(v), t.drawImage(e, 0, Math.round(-e.height / 2), Math.round(m), e.height), t.restore(), w += g, d -= c
            }
            if (void 0 !== n) {
                var S = n.height * a,
                    y = Math.round(n.width * a),
                    P = Math.round(S / 2);
                S = Math.round(S), t.save(), t.translate(Math.round(i.x), Math.round(i.y)), t.rotate(v), t.drawImage(n, r, -P, y, S), t.restore(), t.save(), t.translate(Math.round(s.x), Math.round(s.y)), t.rotate(v + Math.PI), t.drawImage(n, r, -P, y, S), t.restore()
            }
        }, this.initAssets = function() {
            var e = [],
                i = this,
                s = function(t, s) {
                    var a = i.loadWaitAsset(t, s);
                    ++i.loadCounter, a.done(function() {
                        --i.loadCounter
                    }), e.push(a)
                };
            s(T.assets.PSSkillFrame, "PSSkillFrame"), s(T.assets.PSSkillFrameHighlighted, "PSSkillFrameHighlighted"), s(T.assets.PSSkillFrameActive, "PSSkillFrameActive"), s(T.assets.PSGroupBackground1, "PSGroupBackground1"), s(T.assets.PSGroupBackground2, "PSGroupBackground2"), s(T.assets.PSGroupBackground3, "PSGroupBackground3"), s(T.assets.KeystoneFrameUnallocated, "KeystoneFrameUnallocated"), s(T.assets.KeystoneFrameCanAllocate, "KeystoneFrameCanAllocate"), s(T.assets.KeystoneFrameAllocated, "KeystoneFrameAllocated"), s(T.assets.Orbit1Normal, "Orbit1Normal"), s(T.assets.Orbit1Intermediate, "Orbit1Intermediate"), s(T.assets.Orbit1Active, "Orbit1Active"), s(T.assets.Orbit2Normal, "Orbit2Normal"), s(T.assets.Orbit2Intermediate, "Orbit2Intermediate"), s(T.assets.Orbit2Active, "Orbit2Active"), s(T.assets.Orbit3Normal, "Orbit3Normal"), s(T.assets.Orbit3Intermediate, "Orbit3Intermediate"), s(T.assets.Orbit3Active, "Orbit3Active"), s(T.assets.Orbit4Normal, "Orbit4Normal"), s(T.assets.Orbit4Intermediate, "Orbit4Intermediate"), s(T.assets.Orbit4Active, "Orbit4Active"), s(T.assets.LineConnectorNormal, "LineConnectorNormal"), s(T.assets.LineConnectorIntermediate, "LineConnectorIntermediate"), s(T.assets.LineConnectorActive, "LineConnectorActive"), s(T.assets.PSLineDeco, "PSLineDeco"), s(T.assets.PSLineDecoHighlighted, "PSLineDecoHighlighted"), s(T.assets.PSStartNodeBackgroundInactive, "PSStartNodeBackgroundInactive"), s(T.assets.PSStartNodeBackgroundInactive, "PSStartNodeBackgroundInactive"), s(T.assets.centerduelist, "centerduelist"), s(T.assets.centermarauder, "centermarauder"), s(T.assets.centerranger, "centerranger"), s(T.assets.centershadow, "centershadow"), s(T.assets.centertemplar, "centertemplar"), s(T.assets.centerwitch, "centerwitch"), s(T.assets.centerscion, "centerscion"), s(T.assets.Background1, "Background1"), s(T.assets.NotableFrameUnallocated, "NotableFrameUnallocated"), s(T.assets.NotableFrameCanAllocate, "NotableFrameCanAllocate"), s(T.assets.NotableFrameAllocated, "NotableFrameAllocated"), s(T.assets.BlightedNotableFrameUnallocated, "BlightedNotableFrameUnallocated"), s(T.assets.BlightedNotableFrameCanAllocate, "BlightedNotableFrameCanAllocate"), s(T.assets.BlightedNotableFrameAllocated, "BlightedNotableFrameAllocated"), s(T.assets.JewelFrameUnallocated, "JewelFrameUnallocated"), s(T.assets.JewelFrameCanAllocate, "JewelFrameCanAllocate"), s(T.assets.JewelFrameAllocated, "JewelFrameAllocated"), s(T.assets.JewelSocketActiveBlue, "JewelSocketActiveBlue"), s(T.assets.JewelSocketActiveGreen, "JewelSocketActiveGreen"), s(T.assets.JewelSocketActiveRed, "JewelSocketActiveRed"), s(T.assets.JewelSocketActivePrismatic, "JewelSocketActivePrismatic"), s(T.assets.JewelSocketActiveAbyss, "JewelSocketActiveAbyss"), s(T.assets.PassiveSkillScreenJewelCircle1, "PassiveSkillScreenJewelCircle1"), s(T.assets.PassiveSkillScreenVaalJewelCircle1, "PassiveSkillScreenVaalJewelCircle1"), s(T.assets.PassiveSkillScreenVaalJewelCircle2, "PassiveSkillScreenVaalJewelCircle2"), s(T.assets.PassiveSkillScreenKaruiJewelCircle1, "PassiveSkillScreenKaruiJewelCircle1"), s(T.assets.PassiveSkillScreenKaruiJewelCircle2, "PassiveSkillScreenKaruiJewelCircle2"), s(T.assets.PassiveSkillScreenMarakethJewelCircle1, "PassiveSkillScreenMarakethJewelCircle1"), s(T.assets.PassiveSkillScreenMarakethJewelCircle2, "PassiveSkillScreenMarakethJewelCircle2"), s(T.assets.PassiveSkillScreenTemplarJewelCircle1, "PassiveSkillScreenTemplarJewelCircle1"), s(T.assets.PassiveSkillScreenTemplarJewelCircle2, "PassiveSkillScreenTemplarJewelCircle2"), s(T.assets.PassiveSkillScreenEternalEmpireJewelCircle1, "PassiveSkillScreenEternalEmpireJewelCircle1"), s(T.assets.PassiveSkillScreenEternalEmpireJewelCircle2, "PassiveSkillScreenEternalEmpireJewelCircle2");
            var a = ["PassiveSkillScreenAscendancyButton", "PassiveSkillScreenAscendancyButtonHighlight", "PassiveSkillScreenAscendancyButtonPressed", "PassiveSkillScreenAscendancyFrameLargeAllocated", "PassiveSkillScreenAscendancyFrameLargeCanAllocate", "PassiveSkillScreenAscendancyFrameLargeNormal", "PassiveSkillScreenAscendancyFrameSmallAllocated", "PassiveSkillScreenAscendancyFrameSmallCanAllocate", "PassiveSkillScreenAscendancyFrameSmallNormal", "PassiveSkillScreenAscendancyMiddle"];
            for (var n in this.ascendancyClasses)
                for (var r in this.ascendancyClasses[n].classes) a.push("Classes" + this.ascendancyClasses[n].classes[r].name);
            for (var o in a) a.hasOwnProperty(o) && s(T.assets[a[o]], a[o]);
            for (var h in s(T.assets.PSPointsFrame, "PSPointsFrame"), s(T.assets.imgPSFadeCorner, "imgPSFadeCorner"), s(T.assets.imgPSFadeSide, "imgPSFadeSide"), this.skillSprites) {
                T.assets[h] = {};
                n = 0;
                for (var l = this.skillSprites[h].length; n < l; ++n) T.assets[h][this.imageZoomLevels[n]] = T.imageRoot + "/passive-skill/" + this.skillSprites[h][n].filename;
                s(T.assets[h], h)
            }
            return t.when.apply(null, e)
        }, this.loadWaitAsset = function(e, i) {
            var s = this,
                a = function(e, i, a) {
                    var n = new Image,
                        r = t.Deferred();
                    return n.onload = function() {
                        void 0 === a ? s.assets[i] = n : (void 0 === s.assets[i] && (s.assets[i] = {}), s.assets[i][a] = n), r.resolve()
                    }, n.src = e, r.promise()
                };
            if ("object" == _typeof(e)) {
                var n = [];
                for (var r in e) n.push(a(e[r], i, r));
                return t.when.apply(null, n)
            }
            return a(e, i)
        }, this.endLoadingRenderLoop = function() {
            window.cancelAnimationFrame(this.loadingRenderLoopIntervalId)
        }, this.initLoadingRenderLoop = function() {
            var t = this,
                e = this.loadCounter;
            this.loadingRenderLoopIntervalId = window.requestAnimationFrame(function i() {
                var s = 0 == e ? 1 : (e - t.loadCounter) / e;
                t.drawLoading(s), t.loadingRenderLoopIntervalId = window.requestAnimationFrame(i)
            })
        }, this.initRenderLoop = function() {
            var t = this;
            window.requestAnimationFrame(function e() {
                t.drawState.dirty && t.draw(), t.frames++, window.requestAnimationFrame(e)
            }), setInterval(function() {
                t.fps = t.frames, t.frames = 0
            }, 1e3)
        }, this.initGraph = function() {
            for (var t in this.rootNode = new h(T.root), T.nodes) {
                var e = T.nodes[t],
                    s = new h(e);
                if (this.addNode(s), void 0 === this.startNode)
                    for (var a = 0, n = s.startPositionClasses.length; a < n; ++a) {
                        var r = s.startPositionClasses[a];
                        this.characterClassToStartNode[r] = s, r === this.characterClass && (this.startNode = s, s.active = !0)
                    }
                s.isAscendancyStartNode && (this.ascendancyClassToStartNode[s.ascendancyName] = s, this.ascendancyClassName() && this.ascendancyClassName() == s.ascendancyName && (this.ascendancyStartNode = s))
            }
            for (var a in T.root.out) this.rootNode.addOutNode(this.getNode(T.root.out[a]));
            for (var t in T.nodes) {
                e = T.nodes[t], s = this.getNode(e.id);
                for (var a in e.out) s.addOutNode(this.getNode(e.out[a]))
            }
            for (var o in T.groups) {
                for (var c = T.groups[o], d = new l(o, new i(c.x, c.y), c.oo), u = (t = 0, c.n.length); t < u; ++t) {
                    (s = this.getNode(c.n[t])).isAscendancy && (d.isAscendancy = !0, d.ascendancyName = s.ascendancyName), d.addNode(s)
                }
                this.addGroup(d)
            }
            this.extent.tl.x = T.min_x, this.extent.tl.y = T.min_y, this.extent.br.x = T.max_x, this.extent.br.y = T.max_y, this.extent.grow(3 * this.getOrbitRadius(4)), this.defaultExtent = this.extent.clone()
        }, this.getShortestPathsFromActiveNodes = function(t) {
            this.characterClassToStartNode[this.characterClass];
            var e = this,
                i = -1,
                s = [],
                a = function(a) {
                    e.visitBFS(a, function(e) {
                        return e === t
                    }, function(t) {
                        return !e.passiveAllocation.isAllocated(t) && !t.isClassStartNode && !t.isAscendancy
                    }, function(t, e) {
                        s.push({
                            goalNodeData: t,
                            nodeRelationshipData: e
                        }), (-1 == i || t.depth < i) && (i = t.depth);
                        for (var a = s.length - 1; a >= 0; --a) s[a].goalNodeData.depth > i && s.splice(a, 1)
                    })
                };
            return a(this.startNode), this.passiveAllocation.foreachAllocatedSkill(a), s
        }, this.recalculateExtent = function() {
            this.extent = this.defaultExtent.clone();
            var t = this.canvas.width / this.viewPort.zoom,
                e = this.canvas.height / this.viewPort.zoom;
            this.extent.width() < t && this.extent.width(t), this.extent.height() < e && this.extent.height(e), this.extent.centerAt(new i)
        }, this.initTileGrid = function() {
            this.grid = {}, this.grid.xTiles = Math.ceil(this.extent.width() * this.viewPort.zoom / this.tileSize) + 1, this.grid.yTiles = Math.ceil(this.extent.height() * this.viewPort.zoom / this.tileSize) + 1, this.grid.tiles = [];
            for (var t = 0; t < this.grid.yTiles; ++t) {
                this.grid.tiles[t] = [];
                for (var e = 0; e < this.grid.xTiles; ++e) this.grid.tiles[t][e] = new c
            }
        }, this.calcTileGrid = function() {
            this.grid.lExtentToLVisGridOffsetPx = (this.viewPort.bounds.tl.x - this.extent.tl.x) * this.viewPort.zoom, this.grid.tExtentToTVisGridOffsetPx = (this.viewPort.bounds.tl.y - this.extent.tl.y) * this.viewPort.zoom, this.grid.lExtentToRVisGridOffsetPx = (this.viewPort.bounds.br.x - this.extent.tl.x) * this.viewPort.zoom, this.grid.tExtentToBVisGridOffsetPx = (this.viewPort.bounds.br.y - this.extent.tl.y) * this.viewPort.zoom, this.grid.lExtentToLVisGridOffsetTiles = this.grid.lExtentToLVisGridOffsetPx / this.tileSize, this.grid.tExtentToTVisGridOffsetTiles = this.grid.tExtentToTVisGridOffsetPx / this.tileSize, this.grid.lExtentToRVisGridOffsetTiles = this.grid.lExtentToRVisGridOffsetPx / this.tileSize, this.grid.tExtentToBVisGridOffsetTiles = this.grid.tExtentToBVisGridOffsetPx / this.tileSize, this.grid.visGridWidthTiles = this.grid.lExtentToRVisGridOffsetTiles - this.grid.lExtentToLVisGridOffsetTiles, this.grid.visGridHeightTiles = this.grid.tExtentToBVisGridOffsetTiles - this.grid.tExtentToTVisGridOffsetTiles, this.grid.visGridStartXTilePos = Math.floor(this.grid.lExtentToLVisGridOffsetTiles), this.grid.visGridStartYTilePos = Math.floor(this.grid.tExtentToTVisGridOffsetTiles), this.grid.visGridXTileviewPortShift = this.grid.lExtentToLVisGridOffsetTiles - this.grid.visGridStartXTilePos, this.grid.visGridYTileviewPortShift = this.grid.tExtentToTVisGridOffsetTiles - this.grid.visGridStartYTilePos, this.grid.drawTileW = Math.ceil(this.grid.visGridWidthTiles) + Math.ceil(this.grid.visGridXTileviewPortShift), this.grid.drawTileH = Math.ceil(this.grid.visGridHeightTiles) + Math.ceil(this.grid.visGridYTileviewPortShift), this.grid.visGridXviewPortShift = this.grid.visGridXTileviewPortShift * this.tileSize, this.grid.visGridYviewPortShift = this.grid.visGridYTileviewPortShift * this.tileSize
        }, this.initViewPort = function() {
            this.viewPort = {
                skillTree: this,
                position: new i,
                bounds: new e,
                moveStartView: null,
                moveStartWorld: null,
                zoomLevels: k,
                zoomIndex: 0,
                zoom: k[0]
            };
            var t = this;
            this.viewPort.zoomIn = function() {
                this.zoomIndex != this.zoomLevels.length - 1 && (++this.zoomIndex, this.zoom = this.zoomLevels[this.zoomIndex], this.recalcBounds())
            }, this.viewPort.zoomOut = function() {
                this.zoomIndex <= 0 || (--this.zoomIndex, this.zoom = this.zoomLevels[this.zoomIndex], this.recalcBounds())
            }, this.viewPort.recalcBounds = function() {
                var e = !1;
                this.skillTree.recalculateExtent(), this.bounds.width(this.skillTree.canvas.width / this.zoom), this.bounds.height(this.skillTree.canvas.height / this.zoom), this.bounds.centerAt(this.position), this.bounds.br.x > t.extent.br.x && (this.position.x = t.extent.br.x - this.bounds.width() / 2, e = !0), this.bounds.br.y > t.extent.br.y && (this.position.y = t.extent.br.y - this.bounds.height() / 2, e = !0), this.bounds.tl.x < t.extent.tl.x && (this.position.x = t.extent.tl.x + this.bounds.width() / 2, e = !0), this.bounds.tl.y < t.extent.tl.y && (this.position.y = t.extent.tl.y + this.bounds.height() / 2, e = !0), e && this.bounds.centerAt(this.position)
            }, this.viewPort.beginMove = function(t, e) {
                this.moveStartView = new i(t, e), this.moveStartWorld = this.position.clone()
            }, this.viewPort.endMove = function() {
                this.moveStartView = null, this.moveStartWorld = null
            }, this.viewPort.updateMove = function(t, e) {
                return null !== this.moveStartView && (this.moveStartView.x != t || this.moveStartView.y != e) && (this.position = this.moveStartWorld.clone(), this.position.translateX((this.moveStartView.x - t) / this.zoom), this.position.translateY((this.moveStartView.y - e) / this.zoom), this.recalcBounds(), !0)
            }, this.viewPort.setPosition = function(t) {
                this.position = t, this.recalcBounds()
            }, this.viewPort.recalcBounds()
        }, this.initListeners = function() {
            var t = this;
            this.$window.resize(function() {
                t.fullScreen && t.updateCanvasSize()
            })
        }, this.initKeyListeners = function() {
            var t = this;
            this.$window.keypress(function(e) {
                switch (e.which) {
                    case 61:
                        t.viewPort.zoomIn(), t.initTileGrid(), t.drawState.dirty = !0, t.trigMouseMoveHandler();
                        break;
                    case 45:
                        t.viewPort.zoomOut(), t.initTileGrid(), t.drawState.dirty = !0, t.trigMouseMoveHandler();
                        break;
                    case 102:
                        t.allowFullscreenKey && t.toggleFullScreen();
                        break;
                    case 100:
                        t.debug = !t.debug
                }
            })
        }, this.clickHandler = function(t, e) {
            var i = {
                x: t,
                y: e,
                worldPosition: this.getScreenWorldPosition(t, e)
            };
            this.foreachClickable(function(t) {
                return t.onclickTest(i)
            })
        }, this.trigMouseMoveHandler = function() {
            this.mouseMoveHandler(this.mousePos.x, this.mousePos.y)
        }, this.mouseLeaveHander = function() {
            this.mouseUpHandler()
        }, this.mouseUpHandler = function() {
            this.viewPort.endMove(), this.drawState.dirty = !0
        }, this.mouseMoveHandler = function(t, e) {
            var i = {
                x: t,
                y: e,
                worldPosition: this.getScreenWorldPosition(t, e)
            };
            this.foreachClickable(function(t) {
                t.onmousemoveTest(i), t.onmouseoutTest(i)
            })
        }, this.forceMouseOut = function() {
            this.foreachClickable(function(t) {
                return t.forceMouseOut()
            })
        }, this.foreachVisibleGridTile = function(t) {
            for (var e = 0; e < this.grid.drawTileW; ++e)
                for (var i = 0; i < this.grid.drawTileH; ++i) {
                    var s = e + this.grid.visGridStartXTilePos,
                        a = i + this.grid.visGridStartYTilePos;
                    if (!0 === t.call(this, this.grid.tiles[a][s], s, a, e, i)) return
                }
        }, this.initMouseListeners = function() {
            var e = this;
            this.$canvas.on("mouseout", function() {
                e.mouseLeaveHander()
            }), this.$canvas.mousedown(function(t) {
                var i = e.$canvas.offset();
                t.preventDefault(), e.viewPort.beginMove(t.pageX, t.pageY), e.clickHandler(t.pageX - i.left, t.pageY - i.top)
            }), this.$canvas.mouseup(function() {
                e.mouseUpHandler()
            }), this.$canvas.mousemove(function(t) {
                var i = e.$canvas.offset();
                e.mousePos.x = t.pageX - i.left, e.mousePos.y = t.pageY - i.top, e.trigMouseMoveHandler(), e.viewPort.updateMove(t.pageX, t.pageY) && (e.drawState.dirty = !0)
            }), this.$canvas.mouseout(function(t) {
                e.forceMouseOut()
            }), t(this.$canvas).bind("mousewheel", function(t, i) {
                for (var s = 0; s < i; ++s) e.viewPort.zoomIn();
                for (s = 0; s > i; --s) e.viewPort.zoomOut();
                return e.initTileGrid(), e.trigMouseMoveHandler(), e.drawState.dirty = !0, !1
            })
        }, this.drawDebug = function() {
            this.topCtx.fillStyle = "rgb(20,200,20)", this.topCtx.font = "10pt Arial", this.topCtx.fillText("Zoom: " + this.viewPort.zoom, 10, 30), this.topCtx.fillText("FPS: " + this.fps, 10, 60), this.drawState.topDirty = !0
        }, this.drawDebugGridInfo = function() {
            this.topCtx.fillStyle = "rgb(20,200,20)", this.topCtx.font = "10pt Arial";
            var t = 60;
            this.topCtx.fillText("Visible grid | Tile W: " + Number(this.grid.visGridWidthTiles).toFixed(2) + ", Tile H: " + Number(this.grid.visGridWidthTiles).toFixed(2) + ", XS: " + Number(this.grid.visGridXviewPortShift).toFixed(2) + ", YS: " + Number(this.grid.visGridYviewPortShift).toFixed(2), 10, t += 30), this.topCtx.fillText("Visible grid | Start X Tile: " + this.grid.visGridStartXTilePos + ", Start Y Tile: " + this.grid.visGridStartYTilePos, 10, t += 30), this.topCtx.fillText("Draw grid | W: " + this.grid.drawTileW + ", H: " + this.grid.drawTileH, 10, t += 30), this.topCtx.fillText("Grid | W: " + this.grid.tiles[0].length + ", H: " + this.grid.tiles.length, 10, t += 30), this.drawState.topDirty = !0
        }, this.getCurrentImageZoomLevel = function() {
            for (var t = this.imageZoomLevels.length, e = 0; e < t; ++e)
                if (this.viewPort.zoom <= this.imageZoomLevels[e]) return this.imageZoomLevels[e];
            return this.imageZoomLevels[t - 1]
        }, this.loadImage = function(t, e) {
            var i = this,
                s = null;
            void 0 === i.assets[t] ? ((s = new Image).onload = function() {
                e(s), i.assets[t] = s
            }, s.src = t) : e(i.assets[t])
        }, this.drawTile = function(t, s, a) {
            if (!t.dirty && !this.drawState.dirtyFullRedraw) return !1;
            null === t.canvas && (t.canvas = document.createElement("canvas"), t.canvas.width = this.tileSize, t.canvas.height = this.tileSize);
            var n = t.canvas,
                r = n.getContext("2d"),
                o = (n.width, n.height, this.getCurrentImageZoomLevel()),
                h = a / o,
                l = this,
                c = new e;
            c.tl.x = s.x, c.tl.y = s.y, c.width(n.width / a), c.height(n.height / a);
            var d = c.clone();
            d.grow(2 * this.getOrbitRadius(4) + 650), this.drawBackgroundTile(r, s, o, h), this.foreachGroup(function(t) {
                if (d.contains(t.position)) {
                    var e = t.position.clone();
                    e.inverseTranslate(c.tl), e.scale(a), t.isAscendancy || this.drawGroupBackground(r, t, e, o, h);
                    var i = this;
                    t.foreachNode(function(t) {
                        var e = i.getNodePositionInfo(t).position;
                        e.inverseTranslate(c.tl), e.scale(a);
                        for (var s = 0, n = t.startPositionClasses.length; s < n; ++s) i.drawStartNodeBackground(r, e, o, h, t.startPositionClasses[s])
                    })
                }
            });
            var u = this.ascendancyStartNode.group;
            if (u && this.isAscendancyGroupEnabled(u)) {
                var g = l.getAscendancyPositionInfo();
                u.oldPos || (u.oldPos = u.position.clone()), u.position = new i(g.classArtImgPoint.x, g.classArtImgPoint.y)
            }
            return this.foreachGroup(function(t) {
                if (l.isAscendancyGroupEnabled(t) && t.id != u.id && !t.oldPos) {
                    t.oldPos = t.position.clone();
                    var e = new i(u.position.x - u.oldPos.x, u.position.y - u.oldPos.y);
                    t.position = new i(t.oldPos.x + e.x, t.oldPos.y + e.y)
                } else t.isAscendancy || this.drawGroupNodePaths(t, r, c, d)
            }), this.foreachGroup(function(t) {
                d.contains(t.position) && this.drawGroupNodes(t, r, a, o, h, c, function(t) {
                    return !t.isAscendancy
                })
            }), this.drawCircles(r), this.drawAscendancyClassBackground(r, c), this.drawAscendancyClassText(r, c), this.drawStartNodeAscendancyButton(r, c), this.foreachGroup(function(t) {
                l.isAscendancyGroupEnabled(t) && this.drawGroupNodePaths(t, r, c, d)
            }), this.foreachGroup(function(t) {
                l.isAscendancyGroupEnabled(t) && this.drawGroupNodes(t, r, a, o, h, c, function(e) {
                    return l.isAscendancyGroupEnabled(t)
                })
            }), t.dirty = !1, !0
        }, this.drawGroupNodes = function(t, i, s, a, n, r, o) {
            var h = this;
            t.foreachNode(function(l) {
                if (o(l)) {
                    var c = h.getNodePositionInfo(l, t),
                        g = c.position.clone(),
                        v = c.position;
                    if (v.inverseTranslate(r.tl), v.scale(s), !(l.startPositionClasses.length > 0)) {
                        var w = null;
                        w = l.isMastery() ? "mastery" : l.notable ? "notable" + (l.active ? "Active" : "Inactive") : l.keyStone ? "keystone" + (l.active ? "Active" : "Inactive") : "normal" + (l.active ? "Active" : "Inactive");
                        var f = h.skillSprites[w][h.viewPort.zoomIndex].coords[l.skill.icon];
                        if (l.isAscendancyStartNode && (f = !1), f) {
                            var p = h.assets[w][a],
                                m = f.w * n,
                                S = m / 2;
                            m = Math.round(m), i.drawImage(p, f.x, f.y, f.w, f.h, Math.round(v.x - S), Math.round(v.y - S), m, m)
                        }
                        if (!l.isMastery()) {
                            var y = null;
                            if (l.isKeyStone()) y = h.assets["KeystoneFrame" + (l.active ? "Allocated" : l.canAllocate ? "CanAllocate" : "Unallocated")][a];
                            else if (l.notable) y = l.isAscendancy ? h.assets["PassiveSkillScreenAscendancyFrameLarge" + (l.active ? "Allocated" : l.canAllocate ? "CanAllocate" : "Normal")][a] : l.isBlightedNode ? h.assets["BlightedNotableFrame" + (l.active ? "Allocated" : l.canAllocate ? "CanAllocate" : "Unallocated")][a] : h.assets["NotableFrame" + (l.active ? "Allocated" : l.canAllocate ? "CanAllocate" : "Unallocated")][a];
                            else if (l.isAscendancyStartNode) y = h.assets.PassiveSkillScreenAscendancyMiddle[a];
                            else if (l.isAscendancy) y = h.assets["PassiveSkillScreenAscendancyFrameSmall" + (l.active ? "Allocated" : l.canAllocate ? "CanAllocate" : "Normal")][a];
                            else if (l.isJewel) {
                                var P = "JewelFrame";
                                l.canAllocate ? P += "CanAllocate" : l.active ? P += "Allocated" : P += "Unallocated", y = h.assets[P][a]
                            } else y = l.active ? h.assets.PSSkillFrameActive[a] : l.canAllocate ? h.assets.PSSkillFrameHighlighted[a] : h.assets["PSSkillFrame" + (l.active ? "Active" : "")][a];
                            var b = (A = y.width * n) / 2;
                            A = Math.round(A), y && i.drawImage(y, 0, 0, y.width, y.height, Math.round(v.x - b), Math.round(v.y - b), A, A)
                        }
                        if (l.isJewel && l.isSocketedJewel()) {
                            var C = "JewelSocketActive";
                            0 == l.skill.jewel.type.indexOf("JewelAbyss") ? C += "Abyss" : "JewelInt" == l.skill.jewel.type ? C += "Blue" : "JewelDex" == l.skill.jewel.type ? C += "Green" : "JewelPrismatic" == l.skill.jewel.type ? C += "Prismatic" : C += "Red";
                            var A, x = h.assets[C][a];
                            b = (A = x.width * n) / 2;
                            if (A = Math.round(A), i.drawImage(x, 0, 0, x.width, x.height, Math.round(v.x - b), Math.round(v.y - b), A, A), l.skill.radius) {
                                var k = h.getSize(l.skill.radius, a);
                                if (k) {
                                    var T = l.skill.jewel && l.skill.jewel.timelessJewelType ? l.skill.jewel.timelessJewelType : null,
                                        I = {
                                            x: Math.round(v.x),
                                            y: Math.round(v.y),
                                            timelessJewelType: T,
                                            width: k
                                        };
                                    h.jewelCircles[l.skill.hash] = I
                                }
                            }
                        }
                        if (null === l.clickable && !l.isMastery()) {
                            var N, M = new e;
                            N = l.isKeyStone() ? h.nodeRadiusKeystone : l.isMastery() ? h.nodeRadiusMastery : h.nodeRadius, M.tl.x = g.x - N, M.tl.y = g.y - N, M.br.x = g.x + N, M.br.y = g.y + N;
                            var F = new d(M);
                            l.clickable = F, F.onclick = function(t) {
                                h.drawState.dirty = !0, h.drawState.dirtyFullRedraw = !0;
                                var e = !1;
                                if (l.active ? h.passiveAllocation.unallocate(l.skill.getHash()) && (e = !0) : h.passiveAllocation.allocate(l.skill.getHash(), !0) && (e = !0), e && h.settings.highlightShortestPaths && null !== l.pathHighlighterGroup) {
                                    l.pathHighlighterGroup.end();
                                    var i = h.getShortestPathsFromActiveNodes(l);
                                    l.pathHighlighterGroup = new u(h, i), l.pathHighlighterGroup.begin()
                                }
                            }, F.onmousemove = function(t) {
                                var e = t.x,
                                    i = t.y;
                                if (h.drawState.dirty = !0, l.renderState.hover = !0, l.isSocketedJewel() ? l.skill.item.handleItemMouseover(t) : l.popup = h.createPopup(h.midCanvas, Math.round(e + 10), Math.round(i - 10), 300, 200, function(t, e, i) {
                                        var s = 0,
                                            a = 0,
                                            n = Math.round(21 * h.scaleFactor),
                                            r = Math.round(19 * h.scaleFactor),
                                            o = 3 * n,
                                            c = 2 * r;
                                        i.fillStyle = "rgb(200,200,200)", i.font = n + "pt FontinBold", e ? (a = i.measureText(l.skill.displayName).width) > s && (s = a) : i.fillText(l.skill.displayName, 5, Math.round(2 * n));
                                        var d = function(t, i, n) {
                                            if (!t) return !1;
                                            n && (o += c);
                                            for (var r = 0, h = t.length; r < h; ++r)
                                                if (o += c, e) {
                                                    var l = t[r].split("\n");
                                                    for (var d in l)(a = i.measureText(l[d]).width) > s && (s = a), d > 0 && (o += c)
                                                } else {
                                                    l = t[r].split("\n");
                                                    for (var d in l) d > 0 && (o += c), i.fillText(l[d], 5, Math.round(o))
                                                }
                                        };
                                        i.save(), i.font = r + "pt FontinBold", d(l.skill.skillDescription, i), i.font = "italic " + r + "pt FontinBold", i.fillStyle = "#AF6025", d(l.skill.flavourText, i, !0), i.fillStyle = "#808080", d(l.skill.reminderText, i, !0), i.restore(), e && t.resize(s + 10, Math.round(o + c / 2))
                                    }), h.settings.highlightSimilarNodes && h.highlightSimilarNodes(l), h.settings.highlightShortestPaths && null === l.pathHighlighterGroup) {
                                    var s = h.getShortestPathsFromActiveNodes(l);
                                    l.pathHighlighterGroup = new u(h, s), l.pathHighlighterGroup.begin()
                                }
                            }, F.onmouseout = function(t) {
                                h.drawState.dirty = !0, l.renderState.hover = !1, l.isSocketedJewel() ? l.skill.item.handleItemMouseout() : h.removePopup(l.popup), null !== l.similarNodeHighlighter && l.similarNodeHighlighter.end().done(function(t, e) {
                                    return function() {
                                        t.similarNodeHighlighter === e && (t.similarNodeHighlighter = null)
                                    }
                                }(l, l.similarNodeHighlighter)), null !== l.pathHighlighterGroup && (l.pathHighlighterGroup.end(), l.pathHighlighterGroup = null)
                            }
                        }
                    }
                }
            })
        }, this.drawNode = function(t, e) {
            e(t, this.getNodePositionInfo(t))
        }, this.drawPathBetweenNodes = function(t, e, i, s) {
            var a = this.getNodePositionInfo(t),
                n = this.getNodePositionInfo(e);
            if (t.group.id != e.group.id || t.orbit != e.orbit) i(a, n);
            else {
                var r = t.group.position.clone(),
                    o = a.angle,
                    h = n.angle,
                    l = o < h;
                o = l ? a.angle : n.angle;
                var c = (h = l ? n.angle : a.angle) - o;
                if (c > Math.PI) h = (o = h) + (2 * Math.PI - c);
                s(r, o, h, this.orbitRadii[t.orbit])
            }
        }, this.drawLoading = function(t) {
            var e = P.translate("Loading") + "... " + Math.round(100 * t) + "%",
                i = this.canvas.width / 2,
                s = this.canvas.height / 2,
                a = this.ctx.measureText(e);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), this.ctx.fillStyle = "rgb(251,243,241)", this.ctx.font = "20pt FontinBold", this.ctx.fillText(e, Math.round(i - a.width / 2), Math.round(s - 10))
        }, this.draw = function() {
            this.drawState.active = !0, this.calcTileGrid(), (this.drawState.dirtyFullRedraw || !this.lastDrawBounds || this.lastDrawBounds.neq(this.viewPort.bounds)) && (this.lastDrawBounds = this.viewPort.bounds.clone(), this.foreachVisibleGridTile(function(t, e, i, s, a) {
                this.drawTilePos(e, i), this.ctx.drawImage(t.canvas, 0, 0, this.tileSize, this.tileSize, Math.round(s * this.tileSize - this.grid.visGridXviewPortShift), Math.round(a * this.tileSize - this.grid.visGridYviewPortShift), this.tileSize, this.tileSize), this.debug && (this.ctx.strokeStyle = "rgb(20,200,200)", this.ctx.strokeRect(s * this.tileSize - this.grid.visGridXviewPortShift, a * this.tileSize - this.grid.visGridYviewPortShift, this.tileSize, this.tileSize))
            })), this.drawMidCanvas(), this.drawTopCanvas();
            for (var t = 0, e = this.finalDrawFuncs.length; t < e; ++t) this.finalDrawFuncs[t]();
            for (var i in this.finalDrawFuncs = [], this.popups) this.popups[i].draw();
            this.debug && (this.drawDebug(), this.drawDebugGridInfo()), null !== this.errorMessage && (this.ctx.fillStyle = "rgb(251,30,30)", this.ctx.font = "10pt FontinBold", this.ctx.fillText(this.errorMessage, 10, this.canvas.height - 20)), this.drawState.dirty = !1, this.drawState.dirtyFullRedraw = !1, this.drawState.active = !1
        }, this.drawImageTiled = function(t, e, i, s, a, n, r, o) {
            for (var h = t.width * i, l = t.height * s, c = r - a, d = o - n, u = 0, g = Math.ceil(c / h); u < g; ++u)
                for (var v = u * h + a, w = 0, f = Math.ceil(d / l); w < f; ++w) {
                    e.save(), e.translate(v, w * l + n);
                    var p, m = t.width,
                        S = h,
                        y = t.height,
                        P = l;
                    if (u == g - 1) 0 !== (p = c % h) && (S -= h - p, m *= p / h);
                    if (w == f - 1) 0 !== (p = Math.round(d) % Math.round(l)) && (P -= l - p, y *= p / l);
                    e.drawImage(t, 0, 0, m, y, 0, 0, S, P), e.restore()
                }
        }, this.createRotatedCanvasImage = function(t, e, i, s) {
            var a = document.createElement("canvas");
            a.width = i, a.height = s;
            var n = a.getContext("2d");
            return n.save(), n.translate(i / 2, s / 2), n.rotate(e), n.drawImage(t, -t.width / 2, -t.height / 2), n.restore(), a
        }, this.drawTopCanvas = function() {
            this.drawState.topDirty && (this.topCtx.clearRect(0, 0, this.topCanvas.width, this.topCanvas.height), this.drawBorder(), this.drawHeader(), this.drawState.topDirty = !1)
        }, this.drawMidCanvas = function() {
            this.midCtx.clearRect(0, 0, this.midCanvas.width, this.midCanvas.height), this.midDrawObjects.foreachObject(function(t) {
                t.draw()
            })
        }, this.drawBorder = function() {
            var t = this.assets.imgPSFadeCorner[1],
                e = this.assets.imgPSFadeSide[1],
                i = this.scaleFactor,
                s = t.width * i,
                a = t.height * i,
                n = e.height * i,
                r = this.createRotatedCanvasImage(t, Math.PI / 2, t.width, t.height),
                o = this.createRotatedCanvasImage(t, Math.PI, t.width, t.height),
                h = this.createRotatedCanvasImage(t, -Math.PI / 2, t.width, t.height),
                l = this.createRotatedCanvasImage(e, 0, e.width, e.height),
                c = this.createRotatedCanvasImage(e, Math.PI, e.width, e.height),
                d = this.createRotatedCanvasImage(e, -Math.PI / 2, e.height, e.width),
                u = this.createRotatedCanvasImage(e, Math.PI / 2, e.height, e.width);
            this.topCtx.drawImage(t, 0, 0, t.width, t.height, 0, 0, s, a), this.topCtx.drawImage(r, 0, 0, r.width, r.height, this.topCanvas.width - s, 0, s, a), this.topCtx.drawImage(o, 0, 0, o.width, o.height, this.topCanvas.width - s, this.topCanvas.height - a, s, a), this.topCtx.drawImage(h, 0, 0, h.width, h.height, 0, this.topCanvas.height - a, s, a), this.drawImageTiled(c, this.topCtx, i, i, s, this.topCanvas.height - n, this.topCanvas.width - s, this.canvas.height, "rgb(200,200,0)"), this.drawImageTiled(l, this.topCtx, i, i, s, 0, this.topCanvas.width - s, n, "rgb(200,20,200)"), this.drawImageTiled(d, this.topCtx, i, i, 0, a, d.width * i, this.topCanvas.height - a, "rgb(0,20,200)"), this.drawImageTiled(u, this.topCtx, i, i, this.topCanvas.width - u.width * i, a, this.topCanvas.width, this.canvas.height - a)
        }, this.drawHeader = function() {
            if (this.readonly) {
                var t = P.translate("This tree is in read only mode");
                this.topCtx.fillStyle = "rgb(255,20,20)", this.topCtx.font = "10pt FontinRegular";
                var e = this.topCtx.measureText(t);
                this.topCtx.fillText(t, Math.round(this.topCanvas.width / 2 - e.width / 2), 26)
            } else {
                var i = this.passiveAllocation.getPassiveSkillPointsAvailable(),
                    s = this.passiveAllocation.getAscendancyPassiveSkillPointsAvailable();
                if (i > 0 || s > 0) {
                    var a = this.assets.PSPointsFrame[1],
                        n = this.scaleFactor,
                        r = a.width * n,
                        o = a.height * n,
                        h = r / 2,
                        l = Math.round(o / 2),
                        c = this.topCanvas.width / 2;
                    this.topCtx.drawImage(a, 0, 0, a.width, a.height, Math.round(c - r), 20 - l, Math.round(r), Math.round(o)), this.topCtx.drawImage(a, 0, 0, a.width, a.height, Math.round(c), 20 - l, Math.round(r), Math.round(o)), this.topCtx.fillStyle = "rgb(251,243,241)", this.topCtx.font = "10pt FontinBold";
                    var d = "Point" + (1 == i ? "" : "s") + " Left",
                        u = i + " " + P.translate(d),
                        g = (e = this.topCtx.measureText(u), s + " " + P.translate("Ascendancy") + " " + P.translate(d)),
                        v = this.topCtx.measureText(g);
                    this.topCtx.fillText(u, Math.round(c - h - e.width / 2), 20 - l + 16), this.topCtx.fillText(g, Math.round(c + h - v.width / 2), 20 - l + 16)
                }
            }
        }, this.getNodeRadius = function(t) {
            return t.notable ? this.nodeRadiusNotable : t.isKeyStone() ? this.nodeRadiusKeystone : t.isMastery() ? this.nodeRadiusMastery : t.isJewel ? this.nodeRadiusJewel : t.isClassStartNode ? this.nodeRadiusClassStart : this.nodeRadius
        }, this.getScreenWorldPosition = function(t, e) {
            return new i(this.viewPort.bounds.tl.x + t / this.viewPort.zoom, this.viewPort.bounds.tl.y + e / this.viewPort.zoom)
        }, this.worldToScreen = function(t) {
            return new i((t.x - this.viewPort.bounds.tl.x) * this.viewPort.zoom, (t.y - this.viewPort.bounds.tl.y) * this.viewPort.zoom)
        }, this.getTileWorldPosition = function(t, e) {
            var s = new i;
            return s.x = t * this.tileSize / this.viewPort.zoom + this.extent.tl.x, s.y = e * this.tileSize / this.viewPort.zoom + this.extent.tl.y, s
        }, this.drawTilePos = function(t, e) {
            var i = this.getTileWorldPosition(t, e);
            return this.drawTile(this.grid.tiles[e][t], i, this.viewPort.zoom)
        }, this.getAscendancyPositionInfo = function(t) {
            var s = this.getNodePositionInfo(this.startNode).position,
                a = 0,
                n = 1,
                r = Math.sqrt(s.x * s.x + s.y * s.y),
                o = Math.abs(s.x) < 10 && Math.abs(s.y) < 10;
            o || (a = s.x / r, n = -s.y / r);
            var h = this.viewPort.zoom,
                l = Math.atan2(a, n),
                c = this.assets[this.ascendancyButton.state][h],
                d = s.x + 270 * Math.cos(l + Math.PI / 2),
                u = s.y + 270 * Math.sin(l + Math.PI / 2),
                g = new i(d, u),
                v = this.assets["Classes" + this.ascendancyClassName()][h],
                w = s.x + (270 + v.height / h / 2) * Math.cos(l + Math.PI / 2),
                f = s.y + (270 + v.height / h / 2) * Math.sin(l + Math.PI / 2),
                p = new i(w, f),
                m = (new i(p.x - v.width / h / 2, p.y - v.height / h / 2), new i(p.x + v.width / h / 2, p.y + v.height / h / 2), new e);
            m.tl = new i(p.x - v.width / h / 2, p.y - v.height / h / 2), m.br = new i(p.x + v.width / h / 2, p.y + v.height / h / 2), t && (s.inverseTranslate(t.tl), g.inverseTranslate(t.tl), p.inverseTranslate(t.tl));
            var S = {
                distanceFromStartNodeCenter: 270,
                distToCenter: r,
                dirX: a,
                dirY: n,
                isCentered: o,
                worldPos: s,
                ascButtonRot: l,
                img: c,
                buttonPoint: g,
                classArtImg: v,
                classArtImgPoint: p,
                classArtImgBounds: m
            };
            if (this.ascendancyStartNode) {
                var y = this.getNodePositionInfo(this.ascendancyStartNode).position,
                    P = w - y.x,
                    b = f - y.y;
                S.startNodeDX = P, S.startNodeDY = b
            }
            return S
        }, this.drawStartNodeAscendancyButton = function(t, s) {
            var a = this.viewPort.zoom,
                n = this.assets[this.ascendancyButton.state][a];
            if (this.ascendancyClass && this.ascendancyClass > 0) {
                var r = this.getAscendancyPositionInfo(s);
                r.buttonPoint.clone().scale(a);
                var o = r.worldPos;
                o.scale(a), t.save(), t.translate(o.x, o.y), t.rotate(r.ascButtonRot), t.drawImage(n, -n.width / 2, (r.distanceFromStartNodeCenter - n.height / a / 2) * a, n.width, n.height), t.restore();
                var h = new e,
                    l = this.getAscendancyPositionInfo();
                h.tl = new i(l.buttonPoint.x - n.height / a / 2, l.buttonPoint.y - n.height / a / 2), h.br = new i(l.buttonPoint.x + n.height / a / 2, l.buttonPoint.y + n.height / a / 2);
                var c = this;
                this.ascendancyButton.clickable = new d(h), this.ascendancyButton.clickable.onmousemove = function() {
                    "PassiveSkillScreenAscendancyButtonHighlight" != c.ascendancyButton.state && (c.ascendancyButton.state = "PassiveSkillScreenAscendancyButtonHighlight", c.drawState.dirty = !0, c.drawState.dirtyFullRedraw = !0)
                }, this.ascendancyButton.clickable.onmouseout = function() {
                    c.ascendancyButton.state = "PassiveSkillScreenAscendancyButton", c.drawState.dirty = !0, c.drawState.dirtyFullRedraw = !0
                }, this.ascendancyButton.clickable.onclick = function(t) {
                    c.ascendancyButton.state = "PassiveSkillScreenAscendancyButtonPressed", c.ascendancyClassPopupHidden = !c.ascendancyClassPopupHidden, c.drawState.dirty = !0, c.drawState.dirtyFullRedraw = !0, c.lastQuery && "" != c.lastQuery && c.highlightSearchQuery(c.lastQuery), c.drawState.topDirty = !0
                }
            }
        }, this.isAscendancyGroupEnabled = function(t) {
            return t && t.isAscendancy && t.ascendancyName == this.ascendancyClassName() && !this.ascendancyClassPopupHidden
        }, this.ascendancyClassName = function() {
            return !!(this.characterClass >= 0 && this.ascendancyClass && 0 != this.ascendancyClass && this.ascendancyClasses[this.characterClass].classes[this.ascendancyClass]) && this.ascendancyClasses[this.characterClass].classes[this.ascendancyClass].name
        }, this.drawAscendancyClassBackground = function(t, e) {
            if (this.ascendancyClassPopupHidden || !this.ascendancyClass) return !1;
            var i = this.getAscendancyPositionInfo(e),
                s = i.classArtImg,
                a = i.classArtImgPoint;
            a.scale(this.viewPort.zoom), t.drawImage(s, a.x - s.width / 2, a.y - s.height / 2, s.width, s.height)
        }, this.drawAscendancyClassText = function(t, e) {
            if (this.ascendancyClassPopupHidden || !this.ascendancyClass) return !1;
            var s = this.getAscendancyPositionInfo(e),
                a = this.ascendancyClasses[this.characterClass].classes[this.ascendancyClass],
                n = a.flavourTextRect.split(","),
                r = new i(n[0], n[1]),
                o = s.classArtImg,
                h = s.classArtImgPoint,
                l = a.flavourText.split("\n");
            h.scale(this.viewPort.zoom), r.scale(this.viewPort.zoom), t.save(), t.translate(h.x - o.width / 2, h.y - o.height / 2);
            var c = 0,
                d = 48 * this.viewPort.zoom;
            for (var u in t.font = Math.round(d) + "px FontinItalic", l) c += Math.round(d + 4 * this.viewPort.zoom), t.fillStyle = "black", t.strokeText(l[u], r.x, r.y + c), t.fillStyle = "rgb(" + a.flavourTextColour + ")", t.fillText(l[u], r.x, r.y + c);
            t.restore()
        }, this.drawStartNodeBackground = function(t, e, i, s, a) {
            var n = a == this.characterClass,
                r = this.assets[n ? "centerduelist" : "PSStartNodeBackgroundInactive"][i],
                o = r.width * s,
                h = r.height * s,
                l = o / 2,
                c = h / 2,
                d = "PSStartNodeBackgroundInactive";
            if (n) switch (a) {
                case this.constants.classes.StrClass:
                    d = "centermarauder";
                    break;
                case this.constants.classes.DexClass:
                    d = "centerranger";
                    break;
                case this.constants.classes.IntClass:
                    d = "centerwitch";
                    break;
                case this.constants.classes.StrDexClass:
                    d = "centerduelist";
                    break;
                case this.constants.classes.StrIntClass:
                    d = "centertemplar";
                    break;
                case this.constants.classes.DexIntClass:
                    d = "centershadow";
                    break;
                case this.constants.classes.StrDexIntClass:
                    d = "centerscion"
            }
            if (r = this.assets[d][i], t.drawImage(r, 0, 0, r.width, r.height, Math.round(e.x - l), Math.round(e.y - c), Math.round(o), Math.round(h)), n) {
                var u = Math.ceil(25 * this.viewPort.zoom);
                t.font = u + "pt FontinRegular";
                var g = Math.PI / 180 * 300,
                    v = e.x + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.sin(g),
                    w = e.y + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.cos(g);
                t.fillStyle = "rgb(235,46,16)";
                var f = t.measureText(this.stats.getAttribute(this.constants.characterAttributes.Strength));
                t.fillText(this.stats.getAttribute(this.constants.characterAttributes.Strength), v - f.width / 2, w + u / 2);
                g = Math.PI / 180 * 60, v = e.x + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.sin(g), w = e.y + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.cos(g);
                t.beginPath(), t.fillStyle = "rgb(1,217,1)";
                f = t.measureText(this.stats.getAttribute(this.constants.characterAttributes.Dexterity));
                t.fillText(this.stats.getAttribute(this.constants.characterAttributes.Dexterity), v - f.width / 2, w + u / 2);
                g = Math.PI / 180 * 180, v = e.x + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.sin(g), w = e.y + this.constants.PSSCentreInnerRadius * this.viewPort.zoom * Math.cos(g);
                t.beginPath(), t.fillStyle = "rgb(88,130,255)";
                f = t.measureText(this.stats.getAttribute(this.constants.characterAttributes.Intelligence));
                t.fillText(this.stats.getAttribute(this.constants.characterAttributes.Intelligence), v - f.width / 2, w + u / 2)
            }
        }, this.drawGroupBackground = function(t, e, i, s, a) {
            if (e.isOccupiedOrbit(3)) {
                var n = (o = (r = this.assets.PSGroupBackground3[s]).width * a) / 2;
                t.drawImage(r, 0, 0, r.width, r.height, Math.round(i.x - n), Math.round(i.y - n), Math.round(o), Math.round(n)), t.save(), t.translate(Math.round(i.x), Math.round(i.y)), t.rotate(Math.PI), n = Math.round(n), t.translate(0, -n), t.drawImage(this.assets.PSGroupBackground3[s], 0, 0, this.assets.PSGroupBackground3[s].width, this.assets.PSGroupBackground3[s].height, -n, 0, o, n), t.restore()
            }
            if (e.isOccupiedOrbit(2)) {
                var r = this.assets.PSGroupBackground2[s];
                n = (o = Math.round(r.width * a)) / 2;
                t.drawImage(r, 0, 0, r.width, r.height, Math.round(i.x - n), Math.round(i.y - n), o, o)
            }
            if (e.isOccupiedOrbit(1)) {
                var o;
                r = this.assets.PSGroupBackground1[s], n = (o = Math.round(r.width * a)) / 2;
                t.drawImage(r, 0, 0, r.width, r.height, Math.round(i.x - n), Math.round(i.y - n), o, o)
            }
        }, this.drawBackgroundTile = function(t, e, i, s) {
            for (var a = this.assets.Background1[i], n = e.x - this.extent.tl.x, r = e.y - this.extent.tl.y, o = a.width * s, h = a.height * s, l = n % o, c = r % h, d = 0, u = Math.ceil((this.tileSize + l) / o); d < u; ++d)
                for (var g = 0, v = Math.ceil((this.tileSize + c) / h); g < v; ++g) t.drawImage(a, 0, 0, a.width, a.height, Math.round(d * o - l), Math.round(g * h - c), Math.round(o), Math.round(h))
        }, this.drawGroupNodePaths = function(t, e, i, s) {
            if (s.contains(t.position)) {
                var a = this.viewPort.zoom,
                    n = this.getCurrentImageZoomLevel(),
                    r = a / n,
                    o = this;
                t.foreachNode(function(s) {
                    var h = o.getNodePositionInfo(s, t).position;
                    h.inverseTranslate(i.tl), h.scale(a), s.startPositionClasses.length > 0 || s.foreachOutNode(function(t) {
                        var h = o.getNodePositionInfo(t).position;
                        h.inverseTranslate(i.tl), h.scale(a), s.isAscendancy && !t.isAscendancy || t.startPositionClasses.length > 0 || t.isAscendancyStartNode || t.isBlightedNode || o.drawPathBetweenNodes(s, t, function(h, l) {
                            var c = h.position,
                                d = l.position;
                            c.inverseTranslate(i.tl), c.scale(a), d.inverseTranslate(i.tl), d.scale(a);
                            var u = "Normal";
                            s.active && t.active ? u = "Active" : (s.active || t.active) && (u = "Intermediate"), o.drawStraightPath(e, o.assets["LineConnector" + u][n], c, d, r, o.assets["PSLineDeco" + (s.active || t.active ? "Highlighted" : "")][n], (o.nodeRadius - 22) * a)
                        }, function(h, l, c, d) {
                            h.inverseTranslate(i.tl), h.scale(a);
                            var u = "Normal";
                            s.active && t.active ? u = "Active" : (s.active || t.active) && (u = "Intermediate");
                            var g = o.assets["Orbit" + t.orbit + u][n];
                            o.drawArc(e, g, h, l - Math.PI / 2, c - Math.PI / 2, r)
                        })
                    })
                })
            }
        }, this.drawImageCentered = function(t, e, i, s, a) {
            var n = e.width * a,
                r = n / 2,
                o = e.height * a,
                h = o / 2;
            t.drawImage(e, 0, 0, e.width, e.height, Math.round(i.x - r), Math.round(i.y - h), Math.round(n), Math.round(o))
        }, this.foreachGroup = function(t) {
            for (var e in this.groups) t.call(this, this.groups[e])
        }, this.foreachNode = function(t) {
            for (var e in this.nodes)
                if (!0 === t.call(this, this.nodes[e])) return
        }, this.foreachClickable = function(t) {
            var e = this,
                i = !this.ascendancyClassPopupHidden && e.getAscendancyPositionInfo();
            this.foreachNode(function(s) {
                if (null === s.clickable) return !1;
                if (i && !s.isAscendancy) {
                    if (s.isAscendancyStartNode) return !1;
                    if (i.classArtImgBounds.contains(s.clickable.bounds.tl)) return !1;
                    if (i.classArtImgBounds.contains(s.clickable.bounds.br)) return !1
                }
                if (s.isAscendancy && !e.isAscendancyGroupEnabled(s.group)) return !1;
                t.call(e, s.clickable)
            }), !this.ascendancyButton || !this.ascendancyButton.clickable || t.call(e, this.ascendancyButton.clickable)
        }, this.findNodes = function(t) {
            var e = [];
            for (var i in this.nodes) {
                var s = this.nodes[i];
                t.call(this, s) && e.push(s)
            }
            return e
        }, this.getNode = function(t) {
            return this.nodes[t]
        }, this.getGroup = function(t) {
            return this.groups[t]
        }, this.addNode = function(t) {
            this.nodes[t.skill.getHash()] = t
        }, this.addGroup = function(t) {
            this.groups[t.getId()] = t
        }, this.getOrbitSkillCount = function(t) {
            return this.skillsPerOrbit[t]
        }, this.getOrbitAngle = function(t, e) {
            var i = .017453293;
            if (40 == e) switch (t) {
                case 0:
                    return this.getOrbitAngle(0, 12);
                case 1:
                    return this.getOrbitAngle(0, 12) + 10 * i;
                case 2:
                    return this.getOrbitAngle(0, 12) + 20 * i;
                case 3:
                    return this.getOrbitAngle(1, 12);
                case 4:
                    return this.getOrbitAngle(1, 12) + 10 * i;
                case 5:
                    return this.getOrbitAngle(1, 12) + 15 * i;
                case 6:
                    return this.getOrbitAngle(1, 12) + 20 * i;
                case 7:
                    return this.getOrbitAngle(2, 12);
                case 8:
                    return this.getOrbitAngle(2, 12) + 10 * i;
                case 9:
                    return this.getOrbitAngle(2, 12) + 20 * i;
                case 10:
                    return this.getOrbitAngle(3, 12);
                case 11:
                    return this.getOrbitAngle(3, 12) + 10 * i;
                case 12:
                    return this.getOrbitAngle(3, 12) + 20 * i;
                case 13:
                    return this.getOrbitAngle(4, 12);
                case 14:
                    return this.getOrbitAngle(4, 12) + 10 * i;
                case 15:
                    return this.getOrbitAngle(4, 12) + 15 * i;
                case 16:
                    return this.getOrbitAngle(4, 12) + 20 * i;
                case 17:
                    return this.getOrbitAngle(5, 12);
                case 18:
                    return this.getOrbitAngle(5, 12) + 10 * i;
                case 19:
                    return this.getOrbitAngle(5, 12) + 20 * i;
                case 20:
                    return this.getOrbitAngle(6, 12);
                case 21:
                    return this.getOrbitAngle(6, 12) + 10 * i;
                case 22:
                    return this.getOrbitAngle(6, 12) + 20 * i;
                case 23:
                    return this.getOrbitAngle(7, 12);
                case 24:
                    return this.getOrbitAngle(7, 12) + 10 * i;
                case 25:
                    return this.getOrbitAngle(7, 12) + 15 * i;
                case 26:
                    return this.getOrbitAngle(7, 12) + 20 * i;
                case 27:
                    return this.getOrbitAngle(8, 12);
                case 28:
                    return this.getOrbitAngle(8, 12) + 10 * i;
                case 29:
                    return this.getOrbitAngle(8, 12) + 20 * i;
                case 30:
                    return this.getOrbitAngle(9, 12);
                case 31:
                    return this.getOrbitAngle(9, 12) + 10 * i;
                case 32:
                    return this.getOrbitAngle(9, 12) + 20 * i;
                case 33:
                    return this.getOrbitAngle(10, 12);
                case 34:
                    return this.getOrbitAngle(10, 12) + 10 * i;
                case 35:
                    return this.getOrbitAngle(10, 12) + 15 * i;
                case 36:
                    return this.getOrbitAngle(10, 12) + 20 * i;
                case 37:
                    return this.getOrbitAngle(11, 12);
                case 38:
                    return this.getOrbitAngle(11, 12) + 10 * i;
                case 39:
                    return this.getOrbitAngle(11, 12) + 20 * i
            }
            return 2 * Math.PI * t / e
        }, this.getOrbitRadius = function(t) {
            return this.orbitRadii[t]
        }, this.getNodePositionInfo = function(t, e) {
            var i = this.getOrbitRadius(t.orbit),
                s = this.getOrbitAngle(t.orbitIndex, this.getOrbitSkillCount(t.orbit)),
                a = e ? e.position.clone() : t.group.position.clone();
            return a.x -= i * Math.sin(-s), a.y -= i * Math.cos(-s), {
                position: a,
                angle: s
            }
        }, this.createPopup = function(t, e, i, s, a, n) {
            var r = new g(m, t, e, i, s, a, n);
            return this.popups[r.id] = r, ++this.popupId, r
        }, this.removePopup = function(t) {
            delete this.popups[t.id]
        }, this.calculateFlipPosition = function(t, e, i) {
            var s = (e - t) / i,
                a = s % 1;
            return 0 == parseInt(s) % 2 ? a : 1 - a
        }, this.calculateLerpPosition = function(t, e, i) {
            return (e - t) / i
        }, this.createDefaultHighlighterGroup = function(t) {
            var e = this;
            return new S({
                highlighters: [new p(this, {
                    nodes: t.filter(function(t) {
                        return !t.isMastery() && (!t.isAscendancy || e.isAscendancyGroupEnabled(t.group))
                    })
                })]
            })
        }, this.highlightSearchQuery = function(t) {
            var e, i = !0,
                s = !0,
                a = this;
            if (this.lastQuery = t, ("zh_TW" === window.PoELocale || "zh_CN" === window.PoELocale) && t.length >= 1 ? s = !1 : t.length > 2 && (s = !1), !s) {
                t = t.toLowerCase();
                var n = !this.ascendancyClassPopupHidden && a.getAscendancyPositionInfo(),
                    r = this.findNodes(function(e) {
                        if (e.isMastery()) return !1;
                        if (e.isAscendancy && !a.isAscendancyGroupEnabled(e.group)) return !1;
                        if (n && !e.isAscendancy && !a.ascendancyClassPopupHidden && e.clickable && e.clickable.bounds) {
                            if (n.classArtImgBounds.contains(e.clickable.bounds.tl)) return !1;
                            if (n.classArtImgBounds.contains(e.clickable.bounds.br)) return !1
                        }
                        if (-1 != e.skill.displayName.toLowerCase().indexOf(t)) return !0;
                        for (var i = 0, s = e.skill.skillDescription.length; i < s; ++i)
                            if (-1 != e.skill.skillDescription[i].toLowerCase().indexOf(t)) return !0;
                        return !1
                    });
                e = this.createDefaultHighlighterGroup(r), null !== this.searchHighlighter && e.copyStateFrom(this.searchHighlighter)
            }
            null !== this.searchHighlighter && (this.searchHighlighter.endImmediately(), this.searchHighlighter = null, i = !1), s || (this.searchHighlighter = e, i ? this.searchHighlighter.begin() : this.searchHighlighter.beginDefault(e.start))
        }, this.highlightSimilarNodes = function(t) {
            if (null === t.similarNodeHighlighter) {
                var e = this,
                    i = this.findNodes(function(i) {
                        var s = !this.ascendancyClassPopupHidden && e.getAscendancyPositionInfo();
                        if (s && !i.isAscendancy && !e.ascendancyClassPopupHidden && i.clickable && i.clickable.bounds) {
                            if (s.classArtImgBounds.contains(i.clickable.bounds.tl)) return !1;
                            if (s.classArtImgBounds.contains(i.clickable.bounds.br)) return !1
                        }
                        return t.skill.displayName == i.skill.displayName && (e.isAscendancyGroupEnabled(i.group) || !i.isAscendancy)
                    }),
                    s = this.createDefaultHighlighterGroup(i);
                t.similarNodeHighlighter = s, s.begin()
            }
        }, this.visitNodes = function(t, e, i, s) {
            var a = [];
            for (a.push(t), this.ascendancyClass && a.push(this.ascendancyStartNode); a.length > 0;) {
                var n = a.pop(),
                    r = n.skill.getHash();
                void 0 === i[r] && s(n) && (e.push(n), i[r] = !0, n.foreachNeighbourNode(function(t) {
                    var e = t.skill.getHash();
                    void 0 === i[e] && s(t) && a.push(t)
                }))
            }
        }, this.visitBFS = function(t, e, i, s) {
            var a = [],
                n = {},
                r = {};
            a.push(t), n[t.skill.getHash()] = !0;
            var o = function(t, e) {
                    void 0 === r[e.skill.getHash()] && (r[e.skill.getHash()] = new v(e, t))
                },
                h = function(t) {
                    return r[t.skill.getHash()]
                };
            for (o(0, t); a.length > 0;) {
                var l = a.shift(),
                    c = (l.skill.getHash(), r[l.skill.getHash()]);
                if (e(l)) return void s(c, r);
                l.foreachNeighbourNode(function(t) {
                    if (null !== t.skill.getHash() && i(t)) {
                        if (o(c.depth + 1, t), void 0 === n[t.skill.getHash()]) r[t.skill.getHash()].parents.push(l);
                        else h(t).depth - 1 == c.depth && r[t.skill.getHash()].parents.push(l);
                        void 0 === n[t.skill.getHash()] && (n[t.skill.getHash()] = !0, a.push(t))
                    }
                })
            }
        }, this.getHistoryUrl = function() {
            if (!this.isHistorySupported()) return "";
            if (this.buildUrl) return "/build/" + this.buildUrl;
            var t = [];
            for (var e in this.passiveAllocation.allocatedSkills) t.push(e);
            var i = "";
            return this.accountName && this.characterName && (i += "?accountName=" + this.accountName + (this.realm ? "&realm=" + this.realm : "") + "&characterName=" + this.characterName), A(this.fullScreen, {
                characterClass: this.characterClass,
                ascendancyClass: this.ascendancyClass,
                hashes: t,
                version: this.version,
                realm: this.realm
            }) + i
        }, this.loadHistoryUrl = function(t) {
            t = decodeURIComponent(t.replace(/-/g, "+").replace(/_/g, "/"));
            try {
                t = Base64.atob(t)
            } catch (t) {
                this.errorMessage = "Failed to load build from URL. Please make sure it was copied correctly.";
                var e = this;
                return void this.events.pointsChanged.add(function t() {
                    e.events.pointsChanged.remove(t), e.errorMessage = null
                })
            }
            var i, s, a = new w;
            a.setDataString(t);
            var n = 0,
                r = [];
            switch (a.readInt()) {
                case f.CurrentVersion:
                    for (i = a.readInt8(), s = a.readInt8(), n = a.readInt8(); a.hasData();) r.push(a.readInt16());
                    break;
                default:
                    return void alert("The build you are trying to load is using an old version of the passive tree and will not work.")
            }
            this.loadCharacterData(i, s, r), 1 != n || this.fullScreen || this.toggleFullScreen(!0)
        }, this.drawViewportIntersectionPoint = function(t, e) {
            var i = this.viewPort.bounds.intersectionPoint(t, this.viewPort.position, 20);
            !1 !== i && ((i = this.worldToScreen(i)).x < 5 ? i.x += 1 : i.x > this.canvas.width - 5 && (i.x -= 2), i.y < 5 ? i.y += 1 : i.y > this.canvas.height - 5 && (i.y -= 2), this.finalDrawFuncs.push(function() {
                e(i)
            }))
        }, this.drawCircles = function(t) {
            var e = this.jewelCircles;
            for (var i in t.save(), t.globalCompositeOperation = "lighten", e)
                if (e[i]) {
                    var s = null,
                        a = null;
                    e[i].timelessJewelType ? (s = this.assets["PassiveSkillScreen" + e[i].timelessJewelType + "JewelCircle1"][1], a = this.assets["PassiveSkillScreen" + e[i].timelessJewelType + "JewelCircle2"][1]) : s = this.assets.PassiveSkillScreenJewelCircle1[1];
                    var n = Math.round(e[i].width),
                        r = Math.round(n / 2);
                    t.drawImage(s, 0, 0, s.width, s.height, e[i].x - r, e[i].y - r, n, n), a && t.drawImage(a, 0, 0, a.width, a.height, e[i].x - r, e[i].y - r, n, n)
                }
            t.restore(), this.jewelCircles = []
        }, this.getSize = function(t, e) {
            if (this.circles[t])
                for (var i in sizes = this.circles[t], sizes)
                    if (sizes[i].level === e) return sizes[i].width;
            return null
        }, this.init()
    };
    return k.CurrentVersion = x, k
});
define("PoE/PassiveSkillTree/PassiveSkillTreeBuildControls", ["plugins", "PoE/PassiveSkillTree/PassiveSkillTree", "PoE/PassiveSkillTree/GenerateLink", "PoE/Helpers"], function(l, e, s, t) {
    return function(i) {
        this.init = function() {
            this.$controlsForm = l("#passiveControlsForm"), this.$classStartPoint = l("#classStartPoint"), this.$ascendancyClass = l("#ascendancyClass"), this.$permaLink = l("#permaLink"), this.$pointsUsedEl = l("#skillTreeInfo .pointsUsed"), this.$totalPointsEl = l("#skillTreeInfo .totalPoints"), this.$toggleFullScreenEl = l("#toggleFullScreen"), this.$treeLinkEl = l(".tree-link"), this.$window = l(window), this.$controlsContainerEl = l("#passiveSkillTreeControlsContainer"), this.$controlsEl = l("#passiveSkillTreeControls"), this.$buildControlsEl = l("#buildControls"), this.$popupContainerEl = l("#poe-popup-container"), this.$higlightSimilarEl = l("#highlightSimilarNodes"), this.$highlightShortestPathsEl = l("#highlightShortestPaths"), this.$searchBoxEl = l("#passiveSearchBox"), this.$resetEl = l("#resetSkillTree"), this.curHistoryUrl = "", this.skillTree = !1, this.height = i.height, this.fullScreen = !!i.fullScreen, this.ascClasses = i.ascClasses, this.startClass = i.startClass, this.zoomLevels = i.zoomLevels, this.passiveSkillTreeData = i.passiveSkillTreeData, this.version = i.version, this.realm = i.realm, this.buildUrl = i.build ? i.build.id : null, this.buildTitle = i.build ? i.build.title : null, this.builds = i.build && i.build.parts || [], this.circles = i.circles;
            var n = this;
            window.top.location != document.location && (this.$treeLinkEl.show(), this.$toggleFullScreenEl.hide()), this.fullScreen && this.$toggleFullScreenEl.hide();
            var o = function() {
                window.open(n.curHistoryUrl)
            };
            this.skillTree = new e("passiveSkillTree", "poe-popup-container", this.fullScreen ? n.$window.width() : 916, this.height, this.startClass, this.zoomLevels, this.passiveSkillTreeData, {
                events: {
                    classChosen: function(l, e) {
                        n.$classStartPoint.val(l), n.setAscendancyOptions(l)
                    },
                    historyUrlSet: function(l) {
                        n.curHistoryUrl = l, n.$treeLinkEl.off("click").on("click", o)
                    },
                    buildUrlSet: function(l) {
                        n.buildUrl = l
                    },
                    pointsChanged: function() {
                        n.$pointsUsedEl.text(n.skillTree.passiveAllocation.numAllocatedSkills), n.$totalPointsEl.text(n.skillTree.passiveAllocation.getTotalSkillPoints())
                    },
                    onload: function() {
                        setTimeout(function() {
                            n.$controlsEl.slideDown(500)
                        }, 500), n.buildUrl && (n.$buildControlsEl.find("h2").text(n.buildTitle), n.$buildControlsEl.slideDown(500)), n.setCurrentBuildIndex(0)
                    },
                    onFullScreenUpdate: function() {
                        return n.$buildControlsEl.css("height", n.$window.height() - n.$controlsEl.height()), n.$controlsEl.css("width", n.$window.width()), {
                            top: "0px",
                            left: "0px",
                            width: n.$window.width(),
                            height: n.$window.height() - n.$controlsEl.height()
                        }
                    },
                    onFullScreenBegin: function() {
                        n.$popupContainerEl.append(n.$controlsEl), n.$popupContainerEl.append(n.$buildControlsEl), n.$popupContainerEl.addClass("fullscreen"), n.$controlsEl.css("width", n.$window.width()).css("position", "fixed").css("bottom", "0px").css("left", "0px").css("z-index", 1e3), n.$buildControlsEl.css("height", n.$window.height() - n.$controlsEl.height()).css("position", "fixed").css("top", "0px").css("bottom", "0px").css("left", "0px").css("z-index", 1005), n.$toggleFullScreenEl.val(t.translate("Exit Full Screen (f)"))
                    },
                    onFullScreenEnd: function() {
                        n.$controlsEl.css("width", "auto").css("position", "relative"), n.$buildControlsEl.css("height", "auto").css("position", "relative"), n.$controlsContainerEl.append(n.$controlsEl), n.skillTree.containerEl.append(n.$buildControlsEl), n.$popupContainerEl.removeClass("fullscreen"), n.$toggleFullScreenEl.val(t.translate("Full Screen (f)"))
                    }
                },
                fullscreen: n.fullScreen,
                noFullscreenKey: n.fullScreen,
                ascClasses: n.ascClasses,
                realm: n.realm,
                version: n.version,
                buildUrl: n.buildUrl,
                readonly: !!n.buildUrl,
                treeControls: this,
                circles: n.circles
            }), this.setAscendancyOptions = function(e) {
                for (var s in n.$ascendancyClass.empty(), n.$ascendancyClass.append(l("<option></option>").attr("value", 0).text(t.translate("None"))), n.ascClasses[e].classes) {
                    var i = l("<option></option>").attr("value", s).text(n.ascClasses[e].classes[s].displayName);
                    n.skillTree.ascendancyClass && s == n.skillTree.ascendancyClass && i.attr("selected", !0), n.$ascendancyClass.append(i)
                }
            }, this.skillTree.loadStateFromUrl(), this.$classStartPoint.change(function(l) {
                n.skillTree.reset({
                    characterClass: l.target.value,
                    ascendancyClass: 0,
                    accountName: null,
                    characterName: null
                })
            }), this.$ascendancyClass.change(function(l) {
                n.skillTree.reset({
                    characterClass: n.skillTree.characterClass,
                    ascendancyClass: l.target.value,
                    accountName: null,
                    characterName: null
                })
            }), this.$resetEl.click(function(l) {
                n.skillTree.reset({
                    accountName: null,
                    characterName: null
                })
            }), this.$toggleFullScreenEl.click(function(l) {
                n.skillTree.toggleFullScreen()
            }), this.$permaLink.click(function() {
                n.$permaLink.select()
            }), n.skillTree.isHistorySupported() || n.$permaLink.hide(), this.$higlightSimilarEl.change(function(l) {
                n.skillTree.settings.highlightSimilarNodes = n.$higlightSimilarEl.is(":checked")
            }), this.$highlightShortestPathsEl.change(function(l) {
                n.skillTree.settings.highlightShortestPaths = n.$highlightShortestPathsEl.is(":checked")
            }), this.$searchBoxEl.keypress(function(l) {
                l.stopPropagation()
            }), this.$searchBoxEl.keyup(function(l) {
                n.skillTree.highlightSearchQuery(n.$searchBoxEl.val())
            }), this.setCurrentBuildIndex = function(l) {
                if (n.$buildControlsEl.find("ul.options > li > a").removeClass("active"), n.$buildControlsEl.find("ul.options > li > a[data-index=" + l + "]").addClass("active"), l < n.builds.length) {
                    var e = n.builds[l];
                    n.skillTree.reset(e), n.skillTree.passiveAllocation.loadHashArray(e.hashes)
                }
            }, l.each(this.builds, function(e, t) {
                t.realm = n.realm;
                var i = s(0, t),
                    o = l("<li>").append(l("<a>").attr("href", i).text(t.label).attr("data-index", e));
                n.$buildControlsEl.find("ul.options").append(o)
            }), this.$buildControlsEl.on("click", "a", function(e) {
                var s = l(this).attr("data-index");
                n.setCurrentBuildIndex(s), e.preventDefault()
            })
        }, this.init()
    }
});
define("skilltree", ["PoE/PassiveSkillTree/PassiveSkillTree", "PoE/PassiveSkillTree/PassiveSkillTreeBuildControls"], function(e, i) {
    return {
        view: e,
        controls: i
    }
});